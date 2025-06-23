from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class ItemImage(Base):
    """Изображения товара (общие для всех вариантов)."""
    
    __tablename__ = "item_images"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id", ondelete="CASCADE"), nullable=False, index=True)
    image_url = Column(String(255), nullable=False)
    thumbnail_url = Column(String(255), nullable=True)  # Миниатюра
    alt_text = Column(String(255), nullable=True)  # Alt текст для SEO
    order = Column(Integer, default=0)  # Порядок отображения
    is_primary = Column(Boolean, default=False)  # Основное изображение
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    item = relationship("Item", back_populates="images") 