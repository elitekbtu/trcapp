from sqlalchemy import Column, Integer, ForeignKey, DateTime, UniqueConstraint, CheckConstraint, Float, String
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base

class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    variant_id = Column(Integer, ForeignKey("item_variants.id", ondelete="CASCADE"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False, default=1)
    
    # Резервирование и цена на момент добавления
    is_reserved = Column(Integer, default=0)  # Флаг резервирования
    reserved_until = Column(DateTime(timezone=True), nullable=True)  # До какого времени зарезервировано
    price_at_time = Column(Float, nullable=True)  # Цена на момент добавления в корзину
    
    # Метаданные
    added_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Дополнительная информация (например, выбранные опции)
    notes = Column(String(255), nullable=True)

    user = relationship("User", back_populates="cart_items")
    variant = relationship("ItemVariant", back_populates="cart_items")

    __table_args__ = (
        UniqueConstraint("user_id", "variant_id", name="uq_cart_user_variant"),
        CheckConstraint("quantity > 0", name="ck_cart_quantity_positive"),
    )
    
    @property
    def subtotal(self):
        """Подитог для позиции в корзине."""
        price = self.price_at_time if self.price_at_time else (self.variant.actual_price if self.variant else 0)
        return price * self.quantity
    
    @property
    def is_available(self):
        """Проверка доступности товара в нужном количестве."""
        return self.variant and self.variant.available_stock >= self.quantity 