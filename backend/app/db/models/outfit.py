from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
from .item import Item
from app.db.models.associations import user_favorite_outfits

class OutfitItem(Base):
    __tablename__ = 'outfit_items'
    
    id = Column(Integer, primary_key=True, index=True)
    outfit_id = Column(Integer, ForeignKey('outfits.id', ondelete='CASCADE'), nullable=False)
    item_id = Column(Integer, ForeignKey('items.id', ondelete='CASCADE'), nullable=False)
    variant_id = Column(Integer, ForeignKey('item_variants.id', ondelete='SET NULL'), nullable=True)
    item_category = Column(String(50), nullable=False)
    notes = Column(String(255), nullable=True)  # Заметки к элементу образа
    order = Column(Integer, default=0)  # Порядок отображения

    item = relationship("Item")
    variant = relationship("ItemVariant")
    outfit = relationship("Outfit", back_populates="outfit_items")


class Outfit(Base):
    __tablename__ = "outfits"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    style = Column(String(50), nullable=False, index=True)
    description = Column(Text, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Тип образа
    outfit_type = Column(String(50), default="user", index=True)  # user, official, curated
    is_public = Column(Boolean, default=True, index=True)  # Публичный или приватный
    is_featured = Column(Boolean, default=False, index=True)  # Рекомендуемый образ
    
    # Метаданные
    tags = Column(JSON, nullable=True)  # Теги для поиска
    season = Column(String(50), nullable=True)  # Сезон
    occasion = Column(String(100), nullable=True)  # Повод
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    collection = Column(String(100), nullable=True, index=True)
    
    # SEO
    slug = Column(String(255), nullable=True, unique=True, index=True)
    meta_title = Column(String(255), nullable=True)
    meta_description = Column(Text, nullable=True)
    
    # Статистика
    views_count = Column(Integer, default=0)
    likes_count = Column(Integer, default=0)
    
    owner = relationship("User", back_populates="outfits")
    outfit_items = relationship("OutfitItem", back_populates="outfit", cascade="all, delete-orphan", order_by="OutfitItem.order")

    liked_by = relationship(
        "User",
        secondary=user_favorite_outfits,
        back_populates="favorite_outfits",
        lazy="dynamic",
    )

    comments = relationship("Comment", back_populates="outfit", cascade="all, delete-orphan")
    images = relationship("OutfitImage", back_populates="outfit", cascade="all, delete-orphan", order_by="OutfitImage.order")

    @property
    def items_by_category(self):
        """Группировка элементов по категориям."""
        result = {
            "tops": [],
            "bottoms": [],
            "footwear": [],
            "accessories": [],
            "fragrances": [],
        }
        
        category_mapping = {
            'top': 'tops',
            'bottom': 'bottoms',
            'footwear': 'footwear',
            'accessory': 'accessories',
            'fragrance': 'fragrances',
        }
        
        for oi in self.outfit_items:
            category_key = category_mapping.get(oi.item_category, 'accessories')
            result[category_key].append({
                "item": oi.item,
                "variant": oi.variant,
                "notes": oi.notes
            })
        
        return result

    @property
    def total_price(self):
        """Общая стоимость образа."""
        total = 0.0
        for oi in self.outfit_items:
            if oi.variant and oi.variant.actual_price:
                total += oi.variant.actual_price
            elif oi.item and oi.item.base_price:
                total += oi.item.base_price
        return total
    
    @property
    def is_available(self):
        """Проверка доступности всех элементов образа."""
        for oi in self.outfit_items:
            if oi.variant and not oi.variant.available_stock > 0:
                return False
            elif not oi.variant and oi.item and not oi.item.is_available:
                return False
        return True
    
    @property
    def availability_details(self):
        """Детальная информация о доступности элементов."""
        details = []
        for oi in self.outfit_items:
            available = True
            stock = 0
            
            if oi.variant:
                available = oi.variant.available_stock > 0
                stock = oi.variant.available_stock
            elif oi.item:
                available = oi.item.is_available
                stock = oi.item.total_stock
            
            details.append({
                "item_id": oi.item_id,
                "variant_id": oi.variant_id,
                "category": oi.item_category,
                "available": available,
                "stock": stock
            })
        
        return details