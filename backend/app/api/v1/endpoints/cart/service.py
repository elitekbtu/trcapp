from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.db.models.user import User
from app.db.models.item import Item
from app.db.models.cart import CartItem
from .schemas import QuantityUpdate, CartStateOut


def _cart_state(db: Session, user_id: int):
    """Internal helper to compute cart items and aggregates for given user."""
    cart_items = (
        db.query(CartItem)
        .filter(CartItem.user_id == user_id)
        .join(Item, CartItem.item_id == Item.id)
        .all()
    )
    total_items = sum(ci.quantity for ci in cart_items)
    total_price = sum(ci.quantity * (ci.item.price or 0) for ci in cart_items)
    return {
        "items": cart_items,
        "total_items": total_items,
        "total_price": total_price,
    }


def list_cart_items(db: Session, user: User):
    cart_items = (
        db.query(CartItem)
        .filter(CartItem.user_id == user.id)
        .join(Item, CartItem.item_id == Item.id)
        .all()
    )
    return cart_items


def get_cart_state(db: Session, user: User):
    return _cart_state(db, user.id)


def add_to_cart(db: Session, user: User, item_id: int, qty: Optional[int] = 1):
    if qty is None or qty <= 0:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Quantity must be > 0")

    item = db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    # Optional stock validation if attribute exists
    if hasattr(item, "stock") and item.stock is not None:
        # Determine current quantity in cart to calculate available stock
        current_qty_in_cart = (
            db.query(CartItem.quantity)
            .filter(CartItem.user_id == user.id, CartItem.item_id == item_id)
            .scalar() or 0
        )
        if qty + current_qty_in_cart > item.stock:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Not enough stock")

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
    return _cart_state(db, user.id)


def update_cart_item(db: Session, user: User, item_id: int, payload: QuantityUpdate):
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
        return _cart_state(db, user.id)

    item = cart_item.item
    if hasattr(item, "stock") and item.stock is not None and payload.quantity > item.stock:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Not enough stock")

    cart_item.quantity = payload.quantity
    db.commit()
    db.refresh(cart_item)
    return _cart_state(db, user.id)


def remove_cart_item(db: Session, user: User, item_id: int):
    cart_item = (
        db.query(CartItem)
        .filter(CartItem.user_id == user.id, CartItem.item_id == item_id)
        .first()
    )
    if not cart_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not in cart")
    db.delete(cart_item)
    db.commit()
    return _cart_state(db, user.id)


def clear_cart(db: Session, user: User):
    db.query(CartItem).filter(CartItem.user_id == user.id).delete()
    db.commit()
    return _cart_state(db, user.id) 