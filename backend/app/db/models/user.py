from sqlalchemy import Column, Integer, String, Boolean, Date, Float
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.db.models.associations import user_favorite_items, UserView, user_favorite_colors, user_favorite_brands
from app.db.models.preferences import Color, Brand


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    avatar = Column(String, nullable=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    phone_number = Column(String, nullable=True, unique=True, index=True)
    date_of_birth = Column(Date, nullable=True)
    height = Column(Float, nullable=True)
    weight = Column(Float, nullable=True)

    # Body sizes
    chest = Column(Float, nullable=True)
    waist = Column(Float, nullable=True)
    hips = Column(Float, nullable=True)

    # Preferences (stored as comma-separated text for portability)
    favorite_colors = relationship("Color", secondary=user_favorite_colors)
    favorite_brands = relationship("Brand", secondary=user_favorite_brands)

    # Relationships
    favorites = relationship(
        "Item",
        secondary=user_favorite_items,
        back_populates="liked_by",
        lazy="dynamic",
    )

    view_history = relationship("UserView", back_populates="user", cascade="all, delete-orphan")

    # Favorite outfits
    favorite_outfits = relationship(
        "Outfit",
        secondary="user_favorite_outfits",
        back_populates="liked_by",
        lazy="dynamic",
    )

    # View history
    outfit_view_history = relationship("OutfitView", back_populates="user", cascade="all, delete-orphan")

    # Comments authored by the user
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan")

    # Comments liked by the user
    liked_comments = relationship(
        "Comment",
        secondary="comment_likes",
        back_populates="liked_by",
        lazy="dynamic",
    )

    # Cart items
    cart_items = relationship("CartItem", back_populates="user", cascade="all, delete-orphan", lazy="dynamic") 