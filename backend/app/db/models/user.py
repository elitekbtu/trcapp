from sqlalchemy import Column, Integer, String, Boolean, Date, Float, Text
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.db.models.associations import user_favorite_items, UserView


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
    favorite_colors = Column(Text, nullable=True)
    favorite_brands = Column(Text, nullable=True)

    # Relationships
    favorites = relationship(
        "Item",
        secondary=user_favorite_items,
        back_populates="liked_by",
        lazy="dynamic",
    )

    view_history = relationship("UserView", back_populates="user", cascade="all, delete-orphan") 