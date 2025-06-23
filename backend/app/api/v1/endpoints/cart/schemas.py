from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel


class CartItemCreate(BaseModel):
    variant_id: int
    quantity: int = 1
    notes: Optional[str] = None


class CartItemUpdate(BaseModel):
    quantity: Optional[int] = None
    notes: Optional[str] = None


class VariantInfo(BaseModel):
    id: int
    size: Optional[str] = None
    color: Optional[str] = None
    sku: Optional[str] = None
    price: Optional[float] = None
    discount_price: Optional[float] = None
    available_stock: int = 0
    display_name: str = ""
    actual_price: Optional[float] = None

    class Config:
        from_attributes = True


class ItemInfo(BaseModel):
    id: int
    name: str
    brand: Optional[str] = None
    article: Optional[str] = None
    slug: Optional[str] = None
    image_urls: List[str] = []

    class Config:
        from_attributes = True


class CartItemResponse(BaseModel):
    id: int
    variant_id: int
    quantity: int
    price_at_time: Optional[float] = None
    subtotal: float = 0.0
    is_available: bool = True
    is_reserved: bool = False
    reserved_until: Optional[datetime] = None
    notes: Optional[str] = None
    added_at: datetime
    updated_at: Optional[datetime] = None
    variant: VariantInfo
    item: ItemInfo

    class Config:
        from_attributes = True


class CartSummary(BaseModel):
    total: float = 0.0
    total_items: int = 0
    items_count: int = 0
    has_unavailable: bool = False
    unavailable_items: List = []

    class Config:
        from_attributes = True


class CartResponse(BaseModel):
    items: List[CartItemResponse]
    summary: CartSummary

    class Config:
        from_attributes = True


# Старые схемы для совместимости
class CartItemOut(BaseModel):
    item_id: int
    variant_id: int
    name: str
    brand: Optional[str]
    image_url: Optional[str]
    size: Optional[str]
    color: Optional[str]
    sku: Optional[str]
    quantity: int
    price: Optional[float]


class QuantityUpdate(BaseModel):
    quantity: int


class CartStateOut(BaseModel):
    items: List[CartItemOut]
    total_items: int
    total_price: float 