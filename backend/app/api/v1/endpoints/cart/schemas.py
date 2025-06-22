from typing import List
from pydantic import BaseModel
from app.api.v1.endpoints.items.schemas import ItemOut


class CartItemOut(BaseModel):
    id: int
    quantity: int
    item: ItemOut

    class Config:
        orm_mode = True


class QuantityUpdate(BaseModel):
    quantity: int


class CartStateOut(BaseModel):
    items: List[CartItemOut]
    total_items: int
    total_price: float

    class Config:
        orm_mode = True 