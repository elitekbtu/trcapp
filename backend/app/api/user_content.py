from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.core.security import get_current_user, is_admin
from app.db.models.user import User
from app.db.models.item import Item
from app.db.models.associations import user_favorite_items, UserView
from app.api.items import ItemOut

router = APIRouter(prefix="/api/users", tags=["UserContent"], dependencies=[Depends(get_current_user)])


def _check_access(target_user_id: int, current: User):
    if current.id != target_user_id and not is_admin(current):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


# ---------- Favorites ----------


@router.post("/{user_id}/favorites/{item_id}", status_code=status.HTTP_200_OK)
async def toggle_favorite(
    user_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    _check_access(user_id, current)

    item = db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    association_exists = db.query(user_favorite_items).filter(
        user_favorite_items.c.user_id == user_id,
        user_favorite_items.c.item_id == item_id,
    ).first()

    if association_exists:
        db.execute(
            user_favorite_items.delete().where(
                user_favorite_items.c.user_id == user_id,
                user_favorite_items.c.item_id == item_id,
            )
        )
        db.commit()
        return {"detail": "Removed from favorites"}
    else:
        db.execute(user_favorite_items.insert().values(user_id=user_id, item_id=item_id))
        db.commit()
        return {"detail": "Added to favorites"}


@router.get("/{user_id}/favorites", response_model=List[ItemOut])
async def list_favorites(
    user_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    _check_access(user_id, current)
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user.favorites.all()


# ---------- History ----------


@router.get("/{user_id}/history", response_model=List[ItemOut])
async def user_history(
    user_id: int,
    limit: int = 50,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    _check_access(user_id, current)

    sub = (
        db.query(UserView.item_id)
        .filter(UserView.user_id == user_id)
        .order_by(desc(UserView.viewed_at))
        .limit(limit)
        .subquery()
    )
    return db.query(Item).join(sub, Item.id == sub.c.item_id).all() 