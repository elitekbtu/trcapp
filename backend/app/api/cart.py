from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.db.models.user import User
from app.db.models.item import Item
from app.db.models.cart import CartItem
from app.api.items import ItemOut

router = APIRouter(prefix="/api/cart", tags=["Cart"])


class CartItemOut(BaseModel):
    id: int
    quantity: int
    item: ItemOut

    class Config:
        orm_mode = True


class QuantityUpdate(BaseModel):
    quantity: int


@router.get("/", response_model=List[CartItemOut])
def list_cart_items(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    cart_items = (
        db.query(CartItem)
        .filter(CartItem.user_id == user.id)
        .join(Item, CartItem.item_id == Item.id)
        .all()
    )
    return cart_items


@router.post("/{item_id}", response_model=CartItemOut, status_code=status.HTTP_201_CREATED)
def add_to_cart(
    item_id: int,
    qty: Optional[int] = 1,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if qty is None or qty <= 0:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Quantity must be > 0")

    item = db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    cart_item = (
        db.query(CartItem)
        .filter(CartItem.user_id == user.id, CartItem.item_id == item_id)
        .first()
    )
    if cart_item:
        cart_item.quantity += qty
    else:
        cart_item = CartItem(user_id=user.id, item_id=item_id, quantity=qty)
        db.add(cart_item)
    db.commit()
    db.refresh(cart_item)
    return cart_item


@router.put("/{item_id}", response_model=CartItemOut)
def update_cart_item(
    item_id: int,
    payload: QuantityUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    cart_item = (
        db.query(CartItem)
        .filter(CartItem.user_id == user.id, CartItem.item_id == item_id)
        .first()
    )
    if not cart_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not in cart")

    if payload.quantity <= 0:
        db.delete(cart_item)
        db.commit()
        raise HTTPException(status_code=status.HTTP_204_NO_CONTENT)

    cart_item.quantity = payload.quantity
    db.commit()
    db.refresh(cart_item)
    return cart_item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_cart_item(item_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    cart_item = (
        db.query(CartItem)
        .filter(CartItem.user_id == user.id, CartItem.item_id == item_id)
        .first()
    )
    if not cart_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not in cart")
    db.delete(cart_item)
    db.commit()
    return None


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
def clear_cart(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db.query(CartItem).filter(CartItem.user_id == user.id).delete()
    db.commit()
    return None 