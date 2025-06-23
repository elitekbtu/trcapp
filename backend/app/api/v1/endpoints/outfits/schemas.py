from typing import List, Optional, Dict, Any
from pydantic import BaseModel, root_validator, conint, Field, ConfigDict
from datetime import datetime


class OutfitItemBase(BaseModel):
    id: int
    name: str
    brand: Optional[str] = None
    image_url: Optional[str] = None
    price: Optional[float] = None

    class Config:
        orm_mode = True


class OutfitItemCreate(BaseModel):
    """Схема для создания элемента образа."""
    item_id: int = Field(..., description="ID товара")
    variant_id: Optional[int] = Field(None, description="ID варианта товара")
    category: str = Field(..., description="Категория элемента (top, bottom, footwear, accessory, fragrance)")
    notes: Optional[str] = Field(None, max_length=255, description="Заметки к элементу")


class OutfitItemUpdate(BaseModel):
    """Схема для обновления элемента образа."""
    item_id: Optional[int] = Field(None, description="ID товара")
    variant_id: Optional[int] = Field(None, description="ID варианта товара")
    category: Optional[str] = Field(None, description="Категория элемента")
    notes: Optional[str] = Field(None, max_length=255, description="Заметки к элементу")


class OutfitCreate(BaseModel):
    """Схема для создания образа."""
    name: str = Field(..., min_length=3, max_length=100, description="Название образа")
    style: str = Field(..., description="Стиль образа")
    description: Optional[str] = Field(None, description="Описание образа")
    outfit_type: Optional[str] = Field("user", description="Тип образа (user, official, curated)")
    is_public: bool = Field(True, description="Публичный образ")
    tags: Optional[List[str]] = Field(None, description="Теги для поиска")
    season: Optional[str] = Field(None, description="Сезон")
    occasion: Optional[str] = Field(None, description="Повод")
    collection: Optional[str] = Field(None, description="Коллекция")
    items: List[OutfitItemCreate] = Field(..., min_items=1, description="Элементы образа")


class OutfitUpdate(BaseModel):
    """Схема для обновления образа."""
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    style: Optional[str] = None
    description: Optional[str] = None
    outfit_type: Optional[str] = None
    is_public: Optional[bool] = None
    is_featured: Optional[bool] = None
    tags: Optional[List[str]] = None
    season: Optional[str] = None
    occasion: Optional[str] = None
    collection: Optional[str] = None
    items: Optional[List[OutfitItemCreate]] = None


class ItemVariantInfo(BaseModel):
    """Информация о варианте товара в образе."""
    id: int
    size: Optional[str]
    color: Optional[str]
    sku: Optional[str]
    price: Optional[float]
    discount_price: Optional[float]
    available_stock: int
    
    model_config = ConfigDict(from_attributes=True)


class ItemInfo(BaseModel):
    """Информация о товаре в образе."""
    id: int
    name: str
    brand: Optional[str]
    article: Optional[str]
    slug: Optional[str]
    base_price: Optional[float]
    image_urls: List[str]
    
    model_config = ConfigDict(from_attributes=True)


class OutfitItemResponse(BaseModel):
    """Схема ответа для элемента образа."""
    id: int
    item_id: int
    variant_id: Optional[int]
    item_category: str
    notes: Optional[str]
    order: int
    item: ItemInfo
    variant: Optional[ItemVariantInfo]
    
    model_config = ConfigDict(from_attributes=True)


class OutfitImageResponse(BaseModel):
    """Схема ответа для изображения образа."""
    id: int
    image_url: str
    thumbnail_url: Optional[str]
    alt_text: Optional[str]
    order: int
    
    model_config = ConfigDict(from_attributes=True)


class UserInfo(BaseModel):
    """Информация о пользователе."""
    id: int
    username: str
    display_name: Optional[str]
    avatar_url: Optional[str]
    
    model_config = ConfigDict(from_attributes=True)


class OutfitResponse(BaseModel):
    """Схема ответа для образа."""
    id: int
    name: str
    style: str
    description: Optional[str]
    outfit_type: str
    is_public: bool
    is_featured: bool
    tags: Optional[List[str]]
    season: Optional[str]
    occasion: Optional[str]
    collection: Optional[str]
    slug: Optional[str]
    
    # Метаданные
    created_at: datetime
    updated_at: Optional[datetime]
    views_count: int
    likes_count: int
    
    # Связанные данные
    owner: UserInfo
    outfit_items: List[OutfitItemResponse]
    images: List[OutfitImageResponse]
    
    # Вычисляемые поля
    total_price: float
    is_available: bool
    items_by_category: Dict[str, List[Dict[str, Any]]]
    
    model_config = ConfigDict(from_attributes=True)


class OutfitListResponse(BaseModel):
    """Схема ответа для списка образов."""
    id: int
    name: str
    style: str
    outfit_type: str
    is_featured: bool
    slug: Optional[str]
    created_at: datetime
    likes_count: int
    owner: UserInfo
    preview_image: Optional[str] = None
    total_price: float
    items_count: int = 0
    
    model_config = ConfigDict(from_attributes=True)
    
    @property
    def preview_image(self) -> Optional[str]:
        """Получить превью изображение."""
        if self.images:
            return self.images[0].thumbnail_url or self.images[0].image_url
        return None
    
    @property
    def items_count(self) -> int:
        """Количество элементов в образе."""
        return len(self.outfit_items) if hasattr(self, 'outfit_items') else 0


class OutfitLikeResponse(BaseModel):
    """Схема ответа для лайка образа."""
    liked: bool
    likes_count: int


# Для совместимости со старым API
class OutfitOut(BaseModel):
    """Старая схема для совместимости."""
    id: int
    name: str
    style: str
    description: Optional[str]
    owner_id: int
    created_at: datetime
    updated_at: Optional[datetime]
    collection: Optional[str]
    items: Dict[str, List[Any]]
    total_price: float
    
    model_config = ConfigDict(from_attributes=True)


class OutfitCommentCreate(BaseModel):
    content: str
    rating: Optional[conint(ge=1, le=5)] = None


class OutfitCommentOut(OutfitCommentCreate):
    id: int
    user_id: int
    created_at: Optional[datetime]
    likes: Optional[int] = 0

    class Config:
        orm_mode = True 