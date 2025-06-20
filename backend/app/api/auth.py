from datetime import timedelta, datetime
from urllib.parse import urlencode
from authlib.integrations.httpx_client import AsyncOAuth2Client

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.core.security import get_password_hash, create_access_token, authenticate_user, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, oauth2_scheme, blacklist_token, decode_token, get_current_user, create_refresh_token, blacklist_refresh_token, decode_refresh_token, REFRESH_TOKEN_EXPIRE_DAYS
from app.core.config import get_settings
from app.db.models.user import User
from app.api.profile import ProfileOut

router = APIRouter(prefix="/api/auth", tags=["Auth"])

settings = get_settings()

GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v2/userinfo"

SCOPES = ["openid", "email", "profile"]

class UserCreate(BaseModel):
    email: str
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokensOut(TokenOut):
    refresh_token: str


class TokensUserOut(TokensOut):
    user: ProfileOut


# Payload schema for refresh token endpoint
class RefreshTokenIn(BaseModel):
    refresh_token: str


@router.post("/register", response_model=TokensUserOut, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    user = User(
        email=user_in.email.lower(),
        hashed_password=get_password_hash(user_in.password),
        is_admin=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    return TokensUserOut(access_token=access_token, refresh_token=refresh_token, user=ProfileOut.from_orm(user))


@router.post("/token", response_model=TokensUserOut)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username.lower(), form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    refresh_token = create_refresh_token({"sub": str(user.id)})
    return TokensUserOut(access_token=access_token, refresh_token=refresh_token, user=ProfileOut.from_orm(user))


@router.get("/google/login")
async def google_login():
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "response_type": "code",
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        "prompt": "consent",
    }
    url = f"{GOOGLE_AUTH_ENDPOINT}?{urlencode(params)}"
    return {"auth_url": url}


@router.get("/google/callback", response_model=TokensUserOut)
async def google_callback(code: str, db: Session = Depends(get_db)):
    if not code:
        raise HTTPException(status_code=400, detail="Code not provided")

    async with AsyncOAuth2Client(
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
    ) as client:
        token = await client.fetch_token(
            GOOGLE_TOKEN_ENDPOINT,
            code=code,
            grant_type="authorization_code",
            redirect_uri=settings.GOOGLE_REDIRECT_URI,
        )
        resp = await client.get(GOOGLE_USERINFO_ENDPOINT, params={"alt": "json"})
    if resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Could not fetch user info from Google")

    data = resp.json()
    email = data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email not available")

    picture = data.get("picture")
    given_name = data.get("given_name")
    family_name = data.get("family_name")

    user = db.query(User).filter(User.email == email.lower()).first()
    if user is None:
        user = User(
            email=email.lower(),
            hashed_password=get_password_hash(token.get("access_token", email)),
            is_admin=False,
            avatar=picture,
            first_name=given_name,
            last_name=family_name,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        updated = False
        if picture and not user.avatar:
            user.avatar = picture
            updated = True
        if given_name and not user.first_name:
            user.first_name = given_name
            updated = True
        if family_name and not user.last_name:
            user.last_name = family_name
            updated = True
        if updated:
            db.add(user)
            db.commit()
            db.refresh(user)

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    return TokensUserOut(access_token=access_token, refresh_token=refresh_token, user=ProfileOut.from_orm(user))


@router.post("/refresh", response_model=TokensOut)
def refresh_token_route(body: RefreshTokenIn):
    """Exchange a valid refresh token for new access & refresh tokens."""
    refresh_token = body.refresh_token
    rt_payload = decode_refresh_token(refresh_token)

    sub = rt_payload.get("sub")
    if sub is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token payload")

    # Revoke the used refresh token (rotation)
    exp_ts = rt_payload.get("exp")
    ttl = None
    if exp_ts is not None:
        ttl_calc = int(exp_ts - datetime.utcnow().timestamp())
        ttl = ttl_calc if ttl_calc > 0 else 0
    blacklist_refresh_token(refresh_token, ttl)

    access_token = create_access_token({"sub": str(sub)})
    new_refresh_token = create_refresh_token({"sub": str(sub)})
    return TokensOut(access_token=access_token, refresh_token=new_refresh_token)


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(
    token: str = Depends(oauth2_scheme),
    user: User = Depends(get_current_user),
    body: Optional[RefreshTokenIn] = None,
):
    """Logout current user by blacklisting the provided JWT token"""
    payload = decode_token(token)
    exp_ts = payload.get("exp")
    ttl = None
    if exp_ts is not None:
        ttl_calc = int(exp_ts - datetime.utcnow().timestamp())
        ttl = ttl_calc if ttl_calc > 0 else 0
    blacklist_token(token, ttl)

    # Also revoke refresh token if provided
    if body and body.refresh_token:
        try:
            rt_payload = decode_refresh_token(body.refresh_token)
            exp_ts_rt = rt_payload.get("exp")
            ttl_rt = None
            if exp_ts_rt is not None:
                ttl_calc_rt = int(exp_ts_rt - datetime.utcnow().timestamp())
                ttl_rt = ttl_calc_rt if ttl_calc_rt > 0 else 0
            blacklist_refresh_token(body.refresh_token, ttl_rt)
        except HTTPException:
            pass

    return {"detail": "Logout successful"} 