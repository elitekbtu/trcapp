from typing import List, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, status

from sqlalchemy.orm import Session

from app.core.security import require_admin, get_password_hash
from app.core.database import get_db
from app.db.models.user import User
from app.db.models.outfit import Outfit
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/api/users", tags=["Users"], dependencies=[Depends(require_admin)])


@router.get("/", response_model=list[dict])
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [{"id": u.id, "email": u.email, "is_admin": u.is_admin, "is_active": u.is_active} for u in users]


@router.get("/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return {"id": user.id, "email": user.email, "is_admin": user.is_admin, "is_active": user.is_active}


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    db.query(Outfit).filter(Outfit.owner_id == str(user.id)).delete()
    db.delete(user)
    db.commit()
    return None


@router.get("/{user_id}/outfits")
def list_user_outfits(user_id: int, db: Session = Depends(get_db)):
    return db.query(Outfit).filter(Outfit.owner_id == str(user_id)).all()


class UserCreateAdmin(BaseModel):
    email: EmailStr
    password: str
    is_admin: bool = False
    is_active: bool = True


class UserUpdateAdmin(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    is_admin: Optional[bool] = None
    is_active: Optional[bool] = None


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_user_admin(body: UserCreateAdmin, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == body.email.lower()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    user = User(
        email=body.email.lower(),
        hashed_password=get_password_hash(body.password),
        is_admin=body.is_admin,
        is_active=body.is_active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "email": user.email, "is_admin": user.is_admin, "is_active": user.is_active}


@router.patch("/{user_id}", response_model=dict)
def update_user_admin(user_id: int, body: UserUpdateAdmin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if body.email is not None:
        user.email = body.email.lower()
    if body.password is not None:
        user.hashed_password = get_password_hash(body.password)
    if body.is_admin is not None:
        user.is_admin = body.is_admin
    if body.is_active is not None:
        user.is_active = body.is_active

    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "email": user.email, "is_admin": user.is_admin, "is_active": user.is_active} 