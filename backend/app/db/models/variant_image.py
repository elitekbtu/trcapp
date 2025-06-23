from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base

class VariantImage(Base):
    """Изображения для конкретного варианта товара."""
    
    __tablename__ = "variant_images"
    
    id = Column(Integer, primary_key=True, index=True)
    variant_id = Column(Integer, ForeignKey("item_variants.id", ondelete="CASCADE"), nullable=False, index=True)
    image_url = Column(String(255), nullable=False)
    thumbnail_url = Column(String(255), nullable=True)  # Миниатюра
    alt_text = Column(String(255), nullable=True)  # Alt текст для SEO
    order = Column(Integer, default=0)  # Порядок отображения
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    variant = relationship("ItemVariant", back_populates="images") 