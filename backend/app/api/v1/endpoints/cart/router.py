from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.db.models import User, CartItem
from app.api.v1.endpoints.cart import service as cart_service
from app.api.v1.endpoints.cart.service import CartService
from app.api.v1.endpoints.cart.schemas import (
    CartItemCreate,
    CartItemUpdate,
    CartItemResponse,
    CartResponse,
    CartSummary,
    VariantInfo,
    ItemInfo,
    # Для совместимости
    CartStateOut,
    QuantityUpdate
)

router = APIRouter(prefix="/cart", tags=["Cart"])


def _cart_item_to_response(cart_item: CartItem) -> CartItemResponse:
    """Преобразовать CartItem в CartItemResponse."""
    variant_info = VariantInfo(
        id=cart_item.variant.id,
        size=cart_item.variant.size,
        color=cart_item.variant.color,
        sku=cart_item.variant.sku,
        price=cart_item.variant.price,
        discount_price=cart_item.variant.discount_price,
        available_stock=cart_item.variant.available_stock,
        display_name=cart_item.variant.display_name,
        actual_price=cart_item.variant.actual_price
    )
    
    item_info = ItemInfo(
        id=cart_item.variant.item.id,
        name=cart_item.variant.item.name,
        brand=cart_item.variant.item.brand,
        article=cart_item.variant.item.article,
        slug=cart_item.variant.item.slug,
        image_urls=[]  # TODO: Добавить изображения
    )
    
    return CartItemResponse(
        id=cart_item.id,
        variant_id=cart_item.variant_id,
        quantity=cart_item.quantity,
        price_at_time=cart_item.price_at_time,
        subtotal=cart_item.subtotal,
        is_available=cart_item.is_available,
        is_reserved=cart_item.is_reserved,
        reserved_until=cart_item.reserved_until,
        notes=cart_item.notes,
        added_at=cart_item.added_at,
        updated_at=cart_item.updated_at,
        variant=variant_info,
        item=item_info
    )


@router.get("/", response_model=CartResponse)
def get_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить содержимое корзины текущего пользователя."""
    items = CartService.get_cart_items(db, current_user.id)
    summary = CartService.get_cart_summary(db, current_user.id)
    
    # Подготовка ответа с вложенными данными
    cart_items = [_cart_item_to_response(item) for item in items]
    
    return CartResponse(
        items=cart_items,
        summary=CartSummary(**summary)
    )


@router.post("/add", response_model=CartItemResponse, status_code=status.HTTP_201_CREATED)
def add_to_cart(
    item_data: CartItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Добавить товар в корзину."""
    cart_item = CartService.add_to_cart(db, current_user.id, item_data)
    
    return _cart_item_to_response(cart_item)


@router.patch("/{cart_item_id}", response_model=CartItemResponse)
def update_cart_item(
    cart_item_id: int,
    update_data: CartItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновить товар в корзине."""
    cart_item = CartService.update_cart_item(db, current_user.id, cart_item_id, update_data)
    
    return _cart_item_to_response(cart_item)


@router.delete("/{cart_item_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_cart(
    cart_item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Удалить товар из корзины."""
    CartService.remove_from_cart(db, current_user.id, cart_item_id)


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
def clear_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Очистить корзину."""
    CartService.clear_cart(db, current_user.id)


@router.get("/summary", response_model=CartSummary)
def get_cart_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить сводку по корзине."""
    summary = CartService.get_cart_summary(db, current_user.id)
    return CartSummary(**summary)


# Endpoints для совместимости со старым API
@router.get("/state", response_model=CartStateOut, deprecated=True)
def get_cart_state(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """[DEPRECATED] Получить состояние корзины. Используйте GET /cart/"""
    return cart_service.get_cart_state(db, current_user)


@router.post("/add/{variant_id}", response_model=CartStateOut, deprecated=True)
def add_to_cart_old(
    variant_id: int,
    qty: int = 1,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """[DEPRECATED] Добавить товар в корзину. Используйте POST /cart/add"""
    return cart_service.add_to_cart(db, current_user, variant_id, qty)


@router.put("/update/{variant_id}", response_model=CartStateOut, deprecated=True)
def update_cart_item_old(
    variant_id: int,
    payload: QuantityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """[DEPRECATED] Обновить товар в корзине. Используйте PATCH /cart/{cart_item_id}"""
    return cart_service.update_cart_item(db, current_user, variant_id, payload)


@router.delete("/remove/{variant_id}", response_model=CartStateOut, deprecated=True)
def remove_cart_item_old(
    variant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """[DEPRECATED] Удалить товар из корзины. Используйте DELETE /cart/{cart_item_id}"""
    return cart_service.remove_cart_item(db, current_user, variant_id)


@router.delete("/clear/all", response_model=CartStateOut, deprecated=True)
def clear_cart_old(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """[DEPRECATED] Очистить корзину. Используйте DELETE /cart/"""
    return cart_service.clear_cart(db, current_user) 