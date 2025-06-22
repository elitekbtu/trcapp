from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.db.models.user import User
from app.db.models.outfit import Outfit
from .schemas import ProfileUpdate


def get_profile(user: User):
    if user.favorite_colors:
        user.favorite_colors = user.favorite_colors.split(",")
    if user.favorite_brands:
        user.favorite_brands = user.favorite_brands.split(",")
    return user


def update_profile(db: Session, user: User, profile_in: ProfileUpdate):
    update_data = profile_in.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No data provided")

    for field, value in update_data.items():
        if field in {"favorite_colors", "favorite_brands"} and isinstance(value, list):
            value = ",".join(value)
        setattr(user, field, value)

    db.add(user)
    db.commit()
    db.refresh(user)
    if user.favorite_colors and isinstance(user.favorite_colors, str):
        user.favorite_colors = user.favorite_colors.split(",")
    if user.favorite_brands and isinstance(user.favorite_brands, str):
        user.favorite_brands = user.favorite_brands.split(",")
    return user


def delete_profile(db: Session, user: User):
    db.query(Outfit).filter(Outfit.owner_id == str(user.id)).delete()
    db.delete(user)
    db.commit()
    return None 