from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.db.models.associations import comment_likes

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text, nullable=False)
    
    # Связи с объектами
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    item_id = Column(Integer, ForeignKey("items.id", ondelete="CASCADE"), nullable=True, index=True)
    outfit_id = Column(Integer, ForeignKey("outfits.id", ondelete="CASCADE"), nullable=True, index=True)
    
    # Рейтинг (опционально)
    rating = Column(Float, nullable=True)  # Оценка от 1 до 5
    
    # Модерация
    is_approved = Column(Boolean, default=True)  # Одобрен ли комментарий
    is_edited = Column(Boolean, default=False)  # Был ли отредактирован
    
    # Вложенность комментариев
    parent_id = Column(Integer, ForeignKey("comments.id", ondelete="CASCADE"), nullable=True, index=True)
    
    # Временные метки
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Отображение имени пользователя
    display_name = Column(String(100), nullable=True)  # Опциональное имя для отображения
    is_anonymous = Column(Boolean, default=False)  # Анонимный комментарий

    # Relationships
    user = relationship("User", back_populates="comments")
    item = relationship("Item", back_populates="comments")
    outfit = relationship("Outfit", back_populates="comments")
    
    # Вложенные комментарии
    parent = relationship("Comment", remote_side=[id], backref="replies")
    
    liked_by = relationship(
        "User",
        secondary=comment_likes,
        back_populates="liked_comments",
        lazy="dynamic",
    )

    @property
    def author_name(self):
        """Имя автора для отображения."""
        if self.is_anonymous:
            return "Анонимный пользователь"
        elif self.display_name:
            return self.display_name
        elif self.user:
            return self.user.display_name or self.user.username
        return "Пользователь"
    
    @property
    def has_replies(self):
        """Есть ли ответы на комментарий."""
        return len(self.replies) > 0 