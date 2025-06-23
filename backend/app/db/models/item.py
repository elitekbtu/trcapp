from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Boolean, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.db.models.associations import user_favorite_items
from app.db.models.variant import ItemVariant

class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    brand = Column(String(50), nullable=True, index=True)
    clothing_type = Column(String(50), nullable=True, index=True)
    description = Column(Text, nullable=True)
    base_price = Column(Float, nullable=True, index=True)  # Базовая цена
    category = Column(String(50), nullable=True, index=True)
    subcategory = Column(String(50), nullable=True, index=True)  # Подкатегория
    article = Column(String(50), nullable=True, unique=True, index=True)  # Уникальный артикул
    style = Column(String(50), nullable=True, index=True)
    collection = Column(String(100), nullable=True, index=True)
    
    # Новые поля для улучшенной структуры
    is_active = Column(Boolean, default=True, index=True)  # Активен ли товар
    tags = Column(JSON, nullable=True)  # Теги для поиска
    attributes = Column(JSON, nullable=True)  # Дополнительные атрибуты
    
    # SEO и метаданные
    meta_title = Column(String(255), nullable=True)
    meta_description = Column(Text, nullable=True)
    slug = Column(String(255), nullable=True, unique=True, index=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    liked_by = relationship(
        "User",
        secondary=user_favorite_items,
        back_populates="favorites",
        lazy="dynamic",
    )

    comments = relationship("Comment", back_populates="item", cascade="all, delete-orphan")
    images = relationship("ItemImage", back_populates="item", cascade="all, delete-orphan", order_by="ItemImage.order")
    variants = relationship("ItemVariant", back_populates="item", cascade="all, delete-orphan")

    @property
    def image_urls(self):
        """Helper to return list of image URLs for this item."""
        return [img.image_url for img in self.images] if self.images else []
    
    @property
    def available_colors(self):
        """Возвращает список доступных цветов."""
        return list(set(v.color for v in self.variants if v.color and v.stock > 0))
    
    @property
    def available_sizes(self):
        """Возвращает список доступных размеров."""
        return list(set(v.size for v in self.variants if v.size and v.stock > 0))
    
    @property
    def price_range(self):
        """Возвращает диапазон цен для всех вариантов."""
        prices = [v.price for v in self.variants if v.price is not None]
        if not prices:
            return {"min": self.base_price, "max": self.base_price}
        return {"min": min(prices), "max": max(prices)}
    
    @property
    def total_stock(self):
        """Общее количество товара на складе."""
        return sum(v.stock for v in self.variants)
    
    @property
    def is_available(self):
        """Проверка доступности товара."""
        return self.is_active and self.total_stock > 0