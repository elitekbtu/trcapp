from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_admin
from . import service
from .schemas import UserCreateAdmin, UserUpdateAdmin

router = APIRouter(prefix="/users", tags=["Users"], dependencies=[Depends(require_admin)])


@router.get("/", response_model=list[dict])
def list_users(db: Session = Depends(get_db)):
    users = service.list_users(db)
    return [{"id": u.id, "email": u.email, "is_admin": u.is_admin, "is_active": u.is_active} for u in users]


@router.get("/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = service.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return {"id": user.id, "email": user.email, "is_admin": user.is_admin, "is_active": user.is_active}


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = service.delete_user(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return None


@router.get("/{user_id}/outfits")
def list_user_outfits(user_id: int, db: Session = Depends(get_db)):
    return service.list_user_outfits(db, user_id)


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_user_admin(body: UserCreateAdmin, db: Session = Depends(get_db)):
    user = service.create_user_admin(db, body)
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    return {"id": user.id, "email": user.email, "is_admin": user.is_admin, "is_active": user.is_active}


@router.patch("/{user_id}", response_model=dict)
def update_user_admin(user_id: int, body: UserUpdateAdmin, db: Session = Depends(get_db)):
    user = service.update_user_admin(db, user_id, body)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return {"id": user.id, "email": user.email, "is_admin": user.is_admin, "is_active": user.is_active} 