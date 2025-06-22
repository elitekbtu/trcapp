from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user, oauth2_scheme
from app.db.models.user import User
from . import service
from .schemas import UserCreate, TokensUserOut, TokensOut, RefreshTokenIn

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=TokensUserOut, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    return service.register(db, user_in)


@router.post("/token", response_model=TokensUserOut)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    return service.login(db, form_data)


@router.get("/google/login")
async def google_login():
    return service.google_login()


@router.get("/google/callback", response_model=TokensUserOut)
async def google_callback(code: str, db: Session = Depends(get_db)):
    return await service.google_callback(db, code)


@router.post("/refresh", response_model=TokensOut)
def refresh_token_route(body: RefreshTokenIn):
    return service.refresh_token(body)


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(
    token: str = Depends(oauth2_scheme),
    user: User = Depends(get_current_user),
    body: Optional[RefreshTokenIn] = None,
):
    refresh_token = body.refresh_token if body else None
    return service.logout(token, refresh_token) 