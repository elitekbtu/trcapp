from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base

class ItemVariant(Base):
    """SKU / вариант товара (цвет/размер/прочее) с учётом остатка."""

    __tablename__ = "item_variants"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id", ondelete="CASCADE"), nullable=False, index=True)

    # Основные атрибуты варианта
    size = Column(String(20), nullable=True, index=True)
    color = Column(String(30), nullable=True, index=True)
    sku = Column(String(50), nullable=True, unique=True, index=True)
    barcode = Column(String(50), nullable=True, unique=True, index=True)
    
    # Управление складом
    stock = Column(Integer, nullable=False, default=0)
    reserved_stock = Column(Integer, nullable=False, default=0)  # Зарезервировано в корзинах
    min_stock_level = Column(Integer, nullable=True)  # Минимальный уровень для уведомлений
    
    # Цена и скидки
    price = Column(Float, nullable=True)
    discount_price = Column(Float, nullable=True)  # Цена со скидкой
    
    # Дополнительные атрибуты
    weight = Column(Float, nullable=True)  # Вес в граммах
    dimensions = Column(JSON, nullable=True)  # {"length": 0, "width": 0, "height": 0}
    attributes = Column(JSON, nullable=True)  # Дополнительные характеристики
    
    # Статус
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)  # Вариант по умолчанию

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    item = relationship("Item", back_populates="variants")
    cart_items = relationship("CartItem", back_populates="variant", cascade="all, delete-orphan")
    images = relationship("VariantImage", back_populates="variant", cascade="all, delete-orphan", order_by="VariantImage.order")
    
    @property
    def available_stock(self):
        """Доступное количество с учетом резервирования."""
        return max(0, self.stock - self.reserved_stock)
    
    @property
    def actual_price(self):
        """Актуальная цена с учетом скидки."""
        return self.discount_price if self.discount_price else self.price
    
    @property
    def display_name(self):
        """Отображаемое название варианта."""
        parts = []
        if self.color:
            parts.append(self.color)
        if self.size:
            parts.append(self.size)
        return " / ".join(parts) if parts else "Стандарт" 