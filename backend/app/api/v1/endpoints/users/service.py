from typing import List, Optional

from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.db.models.user import User
from app.db.models.outfit import Outfit
from .schemas import UserCreateAdmin, UserUpdateAdmin


def list_users(db: Session) -> List[User]:
    return db.query(User).all()


def get_user(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def delete_user(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    db.query(Outfit).filter(Outfit.owner_id == str(user.id)).delete()
    db.delete(user)
    db.commit()
    return user


def list_user_outfits(db: Session, user_id: int):
    return db.query(Outfit).filter(Outfit.owner_id == str(user_id)).all()


def create_user_admin(db: Session, body: UserCreateAdmin) -> User:
    existing = db.query(User).filter(User.email == body.email.lower()).first()
    if existing:
        return None
    user = User(
        email=body.email.lower(),
        hashed_password=get_password_hash(body.password),
        is_admin=body.is_admin,
        is_active=body.is_active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user_admin(db: Session, user_id: int, body: UserUpdateAdmin) -> Optional[User]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None

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
    return user 