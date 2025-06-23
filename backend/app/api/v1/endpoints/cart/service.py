from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_

from app.db.models import CartItem, ItemVariant, Item, User
from app.api.v1.endpoints.cart.schemas import CartItemCreate, CartItemUpdate
from app.core.exceptions import NotFoundException, ValidationException


class CartService:
    """Сервис для работы с корзиной покупок."""
    
    RESERVATION_DURATION_MINUTES = 30  # Время резервирования в минутах
    
    @staticmethod
    def get_cart_items(db: Session, user_id: int) -> List[CartItem]:
        """Получить все товары в корзине пользователя."""
        # Очистка истекших резервирований
        CartService._clean_expired_reservations(db, user_id)
        
        return db.query(CartItem).filter(
            CartItem.user_id == user_id
        ).options(
            joinedload(CartItem.variant).joinedload(ItemVariant.item)
        ).all()
    
    @staticmethod
    def add_to_cart(
        db: Session, 
        user_id: int, 
        item_data: CartItemCreate
    ) -> CartItem:
        """Добавить товар в корзину с проверкой доступности."""
        # Проверка существования варианта
        variant = db.query(ItemVariant).filter(
            ItemVariant.id == item_data.variant_id
        ).first()
        
        if not variant:
            raise NotFoundException("Вариант товара не найден")
        
        if not variant.is_active:
            raise ValidationException("Вариант товара недоступен")
        
        # Проверка доступного количества
        if variant.available_stock < item_data.quantity:
            raise ValidationException(
                f"Недостаточное количество товара. Доступно: {variant.available_stock}"
            )
        
        # Проверка существующего товара в корзине
        existing_item = db.query(CartItem).filter(
            and_(
                CartItem.user_id == user_id,
                CartItem.variant_id == item_data.variant_id
            )
        ).first()
        
        if existing_item:
            # Обновляем количество
            new_quantity = existing_item.quantity + item_data.quantity
            
            if variant.available_stock < new_quantity:
                raise ValidationException(
                    f"Недостаточное количество товара. Доступно: {variant.available_stock}"
                )
            
            existing_item.quantity = new_quantity
            existing_item.price_at_time = variant.actual_price
            existing_item.updated_at = datetime.utcnow()
            
            # Резервирование
            CartService._reserve_stock(db, variant, item_data.quantity)
            
            db.commit()
            db.refresh(existing_item)
            
            # Загружаем связанные объекты
            existing_item = db.query(CartItem).filter(
                CartItem.id == existing_item.id
            ).options(
                joinedload(CartItem.variant).joinedload(ItemVariant.item)
            ).first()
            
            return existing_item
        
        # Создание нового элемента корзины
        cart_item = CartItem(
            user_id=user_id,
            variant_id=item_data.variant_id,
            quantity=item_data.quantity,
            price_at_time=variant.actual_price,
            is_reserved=1,
            reserved_until=datetime.utcnow() + timedelta(minutes=CartService.RESERVATION_DURATION_MINUTES),
            notes=item_data.notes
        )
        
        # Резервирование
        CartService._reserve_stock(db, variant, item_data.quantity)
        
        db.add(cart_item)
        db.commit()
        db.refresh(cart_item)
        
        # Загружаем связанные объекты
        cart_item = db.query(CartItem).filter(
            CartItem.id == cart_item.id
        ).options(
            joinedload(CartItem.variant).joinedload(ItemVariant.item)
        ).first()
        
        return cart_item
    
    @staticmethod
    def update_cart_item(
        db: Session,
        user_id: int,
        cart_item_id: int,
        update_data: CartItemUpdate
    ) -> CartItem:
        """Обновить количество товара в корзине."""
        cart_item = db.query(CartItem).filter(
            and_(
                CartItem.id == cart_item_id,
                CartItem.user_id == user_id
            )
        ).first()
        
        if not cart_item:
            raise NotFoundException("Товар не найден в корзине")
        
        if update_data.quantity is not None:
            variant = cart_item.variant
            
            # Проверка доступности нового количества
            current_reserved = cart_item.quantity if cart_item.is_reserved else 0
            new_reserved = update_data.quantity - current_reserved
            
            if variant.available_stock < new_reserved:
                raise ValidationException(
                    f"Недостаточное количество товара. Доступно: {variant.available_stock + current_reserved}"
                )
            
            # Обновление резервирования
            if new_reserved > 0:
                CartService._reserve_stock(db, variant, new_reserved)
            elif new_reserved < 0:
                CartService._release_stock(db, variant, abs(new_reserved))
            
            cart_item.quantity = update_data.quantity
            cart_item.updated_at = datetime.utcnow()
            
            # Продление резервирования
            if cart_item.is_reserved:
                cart_item.reserved_until = datetime.utcnow() + timedelta(
                    minutes=CartService.RESERVATION_DURATION_MINUTES
                )
        
        if update_data.notes is not None:
            cart_item.notes = update_data.notes
        
        db.commit()
        db.refresh(cart_item)
        
        # Загружаем связанные объекты
        cart_item = db.query(CartItem).filter(
            CartItem.id == cart_item.id
        ).options(
            joinedload(CartItem.variant).joinedload(ItemVariant.item)
        ).first()
        
        return cart_item
    
    @staticmethod
    def remove_from_cart(db: Session, user_id: int, cart_item_id: int) -> bool:
        """Удалить товар из корзины."""
        cart_item = db.query(CartItem).filter(
            and_(
                CartItem.id == cart_item_id,
                CartItem.user_id == user_id
            )
        ).first()
        
        if not cart_item:
            raise NotFoundException("Товар не найден в корзине")
        
        # Освобождение резервирования
        if cart_item.is_reserved and cart_item.variant:
            CartService._release_stock(db, cart_item.variant, cart_item.quantity)
        
        db.delete(cart_item)
        db.commit()
        
        return True
    
    @staticmethod
    def clear_cart(db: Session, user_id: int) -> bool:
        """Очистить корзину пользователя."""
        cart_items = db.query(CartItem).filter(
            CartItem.user_id == user_id
        ).all()
        
        # Освобождение всех резервирований
        for item in cart_items:
            if item.is_reserved and item.variant:
                CartService._release_stock(db, item.variant, item.quantity)
        
        db.query(CartItem).filter(
            CartItem.user_id == user_id
        ).delete()
        
        db.commit()
        
        return True
    
    @staticmethod
    def get_cart_summary(db: Session, user_id: int) -> dict:
        """Получить сводку по корзине."""
        cart_items = CartService.get_cart_items(db, user_id)
        
        total = 0.0
        total_items = 0
        unavailable_items = []
        
        for item in cart_items:
            if item.is_available:
                total += item.subtotal
                total_items += item.quantity
            else:
                unavailable_items.append({
                    "id": item.id,
                    "variant_id": item.variant_id,
                    "requested": item.quantity,
                    "available": item.variant.available_stock if item.variant else 0
                })
        
        return {
            "total": total,
            "total_items": total_items,
            "items_count": len(cart_items),
            "unavailable_items": unavailable_items,
            "has_unavailable": len(unavailable_items) > 0
        }
    
    @staticmethod
    def _reserve_stock(db: Session, variant: ItemVariant, quantity: int):
        """Зарезервировать товар."""
        variant.reserved_stock += quantity
        db.add(variant)
    
    @staticmethod
    def _release_stock(db: Session, variant: ItemVariant, quantity: int):
        """Освободить зарезервированный товар."""
        variant.reserved_stock = max(0, variant.reserved_stock - quantity)
        db.add(variant)
    
    @staticmethod
    def _clean_expired_reservations(db: Session, user_id: int):
        """Очистить истекшие резервирования."""
        expired_items = db.query(CartItem).filter(
            and_(
                CartItem.user_id == user_id,
                CartItem.is_reserved == 1,
                CartItem.reserved_until < datetime.utcnow()
            )
        ).all()
        
        for item in expired_items:
            if item.variant:
                CartService._release_stock(db, item.variant, item.quantity)
            item.is_reserved = 0
            item.reserved_until = None
        
        if expired_items:
            db.commit() 