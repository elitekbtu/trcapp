from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Table
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
from .item import Item

# Association tables
outfit_top_association = Table(
    'outfit_top_association', Base.metadata,
    Column('outfit_id', Integer, ForeignKey('outfits.id')),
    Column('item_id', Integer, ForeignKey('items.id'))
)

outfit_bottom_association = Table(
    'outfit_bottom_association', Base.metadata,
    Column('outfit_id', Integer, ForeignKey('outfits.id')),
    Column('item_id', Integer, ForeignKey('items.id'))
)

outfit_footwear_association = Table(
    'outfit_footwear_association', Base.metadata,
    Column('outfit_id', Integer, ForeignKey('outfits.id')),
    Column('item_id', Integer, ForeignKey('items.id'))
)

outfit_accessories_association = Table(
    'outfit_accessories_association', Base.metadata,
    Column('outfit_id', Integer, ForeignKey('outfits.id')),
    Column('item_id', Integer, ForeignKey('items.id'))
)

outfit_fragrances_association = Table(
    'outfit_fragrances_association', Base.metadata,
    Column('outfit_id', Integer, ForeignKey('outfits.id')),
    Column('item_id', Integer, ForeignKey('items.id'))
)

class Outfit(Base):
    __tablename__ = "outfits"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    style = Column(String(50), nullable=False, index=True)
    description = Column(Text, nullable=True)
    owner_id = Column(String(50), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    tops = relationship("Item", secondary=outfit_top_association)
    bottoms = relationship("Item", secondary=outfit_bottom_association)
    footwear = relationship("Item", secondary=outfit_footwear_association)
    accessories = relationship("Item", secondary=outfit_accessories_association)
    fragrances = relationship("Item", secondary=outfit_fragrances_association)

    @property
    def total_price(self):
        total = 0.0
        for item in self.tops + self.bottoms + self.footwear + self.accessories + self.fragrances:
            if item.price:
                total += item.price
        return total