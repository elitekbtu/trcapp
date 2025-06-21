from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, HttpUrl, constr, validator
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.db.models.user import User
from app.db.models.outfit import Outfit

router = APIRouter(prefix="/api/profile", tags=["Profile"], dependencies=[Depends(get_current_user)])

PHONE_REGEX = r"^\+?[0-9]{7,15}$"


class ProfileOut(BaseModel):
    id: int
    email: str
    avatar: Optional[HttpUrl] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    date_of_birth: Optional[date] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    chest: Optional[float] = None
    waist: Optional[float] = None
    hips: Optional[float] = None
    favorite_colors: Optional[list[str]] = None
    favorite_brands: Optional[list[str]] = None
    is_admin: bool = False

    class Config:
        orm_mode = True

    # Accept values coming from DB as comma-separated strings and convert to lists
    @validator("favorite_colors", "favorite_brands", pre=True)
    def _split_csv(cls, v):
        if v is None:
            return None
        # Already list
        if isinstance(v, list):
            return v
        # Empty string => None / empty list
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return []
            return v.split(",")
        return v


class ProfileUpdate(BaseModel):
    avatar: Optional[HttpUrl] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[constr(regex=PHONE_REGEX)] = None
    date_of_birth: Optional[date] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    chest: Optional[float] = None
    waist: Optional[float] = None
    hips: Optional[float] = None
    favorite_colors: Optional[list[str]] = None
    favorite_brands: Optional[list[str]] = None

    @validator("height", "weight", "chest", "waist", "hips")
    def positive_values(cls, v):
        if v is not None and v <= 0:
            raise ValueError("Value must be positive")
        return v

    @validator("date_of_birth")
    def check_dob(cls, v: Optional[date]):
        from datetime import date as _date
        if v is not None and v > _date.today():
            raise ValueError("Date of birth cannot be in the future")
        return v


@router.get("/", response_model=ProfileOut)
def get_profile(user: User = Depends(get_current_user)):
    # convert prefs
    if user.favorite_colors:
        user.favorite_colors = user.favorite_colors.split(",")
    if user.favorite_brands:
        user.favorite_brands = user.favorite_brands.split(",")
    return user


@router.patch("/", response_model=ProfileOut)
def update_profile(
    profile_in: ProfileUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    update_data = profile_in.dict(exclude_unset=True)
    # Ensure at least one field present
    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No data provided")

    for field, value in update_data.items():
        if field in {"favorite_colors", "favorite_brands"} and isinstance(value, list):
            value = ",".join(value)
        setattr(user, field, value)

    db.add(user)
    db.commit()
    db.refresh(user)
    if user.favorite_colors:
        user.favorite_colors = user.favorite_colors.split(",")
    if user.favorite_brands:
        user.favorite_brands = user.favorite_brands.split(",")
    return user


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
def delete_profile(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Delete the current user's account along with their outfits and related data."""
    # Remove related outfits (or any other cascading entities) first to keep DB integrity
    db.query(Outfit).filter(Outfit.owner_id == str(user.id)).delete()
    db.delete(user)
    db.commit()
    return None 