from sqlalchemy import Table, Column, Integer, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base

# Association table for user favorites (many-to-many User <-> Item)
user_favorite_items = Table(
    "user_favorite_items",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("item_id", Integer, ForeignKey("items.id"), primary_key=True),
    Column("created_at", DateTime(timezone=True), server_default=func.now()),
)

# -------------------- NEW ASSOCIATION TABLES --------------------

# Favorites for outfits (many-to-many User <-> Outfit)
user_favorite_outfits = Table(
    "user_favorite_outfits",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("outfit_id", Integer, ForeignKey("outfits.id"), primary_key=True),
    Column("created_at", DateTime(timezone=True), server_default=func.now()),
)

# Likes for comments (many-to-many User <-> Comment)
comment_likes = Table(
    "comment_likes",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("comment_id", Integer, ForeignKey("comments.id"), primary_key=True),
    Column("created_at", DateTime(timezone=True), server_default=func.now()),
)

# History of item views by user
class UserView(Base):
    __tablename__ = "user_view_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False, index=True)
    viewed_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationships
    user = relationship("User", back_populates="view_history")
    item = relationship("Item")

# History of outfit views by user
class OutfitView(Base):
    __tablename__ = "outfit_view_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    outfit_id = Column(Integer, ForeignKey("outfits.id"), nullable=False, index=True)
    viewed_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    user = relationship("User", back_populates="outfit_view_history")
    outfit = relationship("Outfit") 