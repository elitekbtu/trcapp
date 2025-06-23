from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, case
from datetime import datetime

from app.db.models import Item, ItemVariant, ItemImage, VariantImage, User, Comment
from app.api.v1.endpoints.items.schemas import ItemCreate, ItemUpdate, VariantCreate, VariantUpdate
from app.core.exceptions import NotFoundException, ValidationException, ConflictException
from app.core.utils import generate_slug, generate_sku


class ItemServiceV2:
    """Улучшенный сервис для работы с товарами."""
    
    @staticmethod
    def get_items(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        category: Optional[str] = None,
        subcategory: Optional[str] = None,
        brand: Optional[str] = None,
        style: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        color: Optional[str] = None,
        size: Optional[str] = None,
        in_stock: Optional[bool] = None,
        search: Optional[str] = None,
        sort_by: Optional[str] = "created_at",
        sort_order: str = "desc"
    ) -> Dict[str, Any]:
        """Получить список товаров с расширенной фильтрацией."""
        query = db.query(Item).options(
            joinedload(Item.variants),
            joinedload(Item.images),
            joinedload(Item.comments)
        )
        
        # Базовый фильтр - только активные товары
        query = query.filter(Item.is_active == True)
        
        # Фильтрация по категориям
        if category:
            query = query.filter(Item.category == category)
        if subcategory:
            query = query.filter(Item.subcategory == subcategory)
        
        # Фильтрация по бренду и стилю
        if brand:
            query = query.filter(Item.brand == brand)
        if style:
            query = query.filter(Item.style == style)
        
        # Фильтрация по цене
        if min_price is not None or max_price is not None:
            # Подзапрос для получения минимальной и максимальной цены вариантов
            price_subquery = db.query(
                ItemVariant.item_id,
                func.min(
                    case(
                        (ItemVariant.discount_price.isnot(None), ItemVariant.discount_price),
                        else_=ItemVariant.price
                    )
                ).label('min_price'),
                func.max(
                    case(
                        (ItemVariant.discount_price.isnot(None), ItemVariant.discount_price),
                        else_=ItemVariant.price
                    )
                ).label('max_price')
            ).group_by(ItemVariant.item_id).subquery()
            
            query = query.join(price_subquery, Item.id == price_subquery.c.item_id)
            
            if min_price is not None:
                query = query.filter(price_subquery.c.max_price >= min_price)
            if max_price is not None:
                query = query.filter(price_subquery.c.min_price <= max_price)
        
        # Фильтрация по цвету и размеру через варианты
        if color or size or in_stock is not None:
            variant_filters = []
            if color:
                variant_filters.append(ItemVariant.color == color)
            if size:
                variant_filters.append(ItemVariant.size == size)
            if in_stock is True:
                variant_filters.append(ItemVariant.stock > ItemVariant.reserved_stock)
            
            if variant_filters:
                query = query.join(ItemVariant).filter(and_(*variant_filters))
                query = query.distinct()
        
        # Поиск по тексту
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Item.name.ilike(search_term),
                    Item.description.ilike(search_term),
                    Item.brand.ilike(search_term),
                    Item.article.ilike(search_term),
                    Item.tags.contains([search])
                )
            )
        
        # Подсчет общего количества
        total = query.count()
        
        # Сортировка
        order_column = getattr(Item, sort_by, Item.created_at)
        if sort_order == "asc":
            query = query.order_by(order_column.asc())
        else:
            query = query.order_by(order_column.desc())
        
        # Пагинация
        items = query.offset(skip).limit(limit).all()
        
        # Агрегация для фильтров
        aggregations = ItemServiceV2._get_aggregations(db, base_filters={
            "category": category,
            "subcategory": subcategory,
            "is_active": True
        })
        
        return {
            "items": items,
            "total": total,
            "skip": skip,
            "limit": limit,
            "aggregations": aggregations
        }
    
    @staticmethod
    def get_item_by_id(db: Session, item_id: int) -> Item:
        """Получить товар по ID."""
        item = db.query(Item).options(
            joinedload(Item.variants).joinedload(ItemVariant.images),
            joinedload(Item.images),
            joinedload(Item.comments).joinedload(Comment.user)
        ).filter(Item.id == item_id).first()
        
        if not item:
            raise NotFoundException("Товар не найден")
        
        return item
    
    @staticmethod
    def get_item_by_slug(db: Session, slug: str) -> Item:
        """Получить товар по slug."""
        item = db.query(Item).options(
            joinedload(Item.variants).joinedload(ItemVariant.images),
            joinedload(Item.images),
            joinedload(Item.comments)
        ).filter(Item.slug == slug).first()
        
        if not item:
            raise NotFoundException("Товар не найден")
        
        return item
    
    @staticmethod
    def create_item(db: Session, item_data: ItemCreate) -> Item:
        """Создать новый товар."""
        # Проверка уникальности артикула
        if item_data.article:
            existing = db.query(Item).filter(Item.article == item_data.article).first()
            if existing:
                raise ConflictException(f"Товар с артикулом {item_data.article} уже существует")
        
        # Создание товара
        item_dict = item_data.dict(exclude={"variants", "images"})
        item_dict["slug"] = generate_slug(item_data.name)
        
        item = Item(**item_dict)
        db.add(item)
        db.flush()
        
        # Добавление вариантов
        if item_data.variants:
            for variant_data in item_data.variants:
                variant = ItemServiceV2._create_variant(db, item.id, variant_data)
        
        # Добавление изображений
        if item_data.images:
            for idx, image_data in enumerate(item_data.images):
                image = ItemImage(
                    item_id=item.id,
                    image_url=image_data.url,
                    thumbnail_url=image_data.thumbnail_url,
                    alt_text=image_data.alt_text or item.name,
                    order=idx,
                    is_primary=(idx == 0)
                )
                db.add(image)
        
        db.commit()
        db.refresh(item)
        
        return item
    
    @staticmethod
    def update_item(
        db: Session,
        item_id: int,
        update_data: ItemUpdate
    ) -> Item:
        """Обновить товар."""
        item = db.query(Item).filter(Item.id == item_id).first()
        
        if not item:
            raise NotFoundException("Товар не найден")
        
        # Обновление основных полей
        update_dict = update_data.dict(exclude_unset=True, exclude={"variants", "images"})
        
        # Обновление slug при изменении названия
        if "name" in update_dict:
            update_dict["slug"] = generate_slug(update_dict["name"])
        
        # Проверка уникальности артикула
        if "article" in update_dict and update_dict["article"] != item.article:
            existing = db.query(Item).filter(
                and_(
                    Item.article == update_dict["article"],
                    Item.id != item_id
                )
            ).first()
            if existing:
                raise ConflictException(f"Товар с артикулом {update_dict['article']} уже существует")
        
        for key, value in update_dict.items():
            setattr(item, key, value)
        
        db.commit()
        db.refresh(item)
        
        return item
    
    @staticmethod
    def delete_item(db: Session, item_id: int) -> bool:
        """Удалить товар (мягкое удаление)."""
        item = db.query(Item).filter(Item.id == item_id).first()
        
        if not item:
            raise NotFoundException("Товар не найден")
        
        # Мягкое удаление
        item.is_active = False
        
        # Деактивация всех вариантов
        db.query(ItemVariant).filter(ItemVariant.item_id == item_id).update(
            {"is_active": False}
        )
        
        db.commit()
        
        return True
    
    @staticmethod
    def create_variant(
        db: Session,
        item_id: int,
        variant_data: VariantCreate
    ) -> ItemVariant:
        """Создать вариант товара."""
        item = db.query(Item).filter(Item.id == item_id).first()
        
        if not item:
            raise NotFoundException("Товар не найден")
        
        return ItemServiceV2._create_variant(db, item_id, variant_data)
    
    @staticmethod
    def update_variant(
        db: Session,
        variant_id: int,
        update_data: VariantUpdate
    ) -> ItemVariant:
        """Обновить вариант товара."""
        variant = db.query(ItemVariant).filter(ItemVariant.id == variant_id).first()
        
        if not variant:
            raise NotFoundException("Вариант товара не найден")
        
        update_dict = update_data.dict(exclude_unset=True)
        
        # Проверка уникальности SKU
        if "sku" in update_dict and update_dict["sku"] != variant.sku:
            existing = db.query(ItemVariant).filter(
                and_(
                    ItemVariant.sku == update_dict["sku"],
                    ItemVariant.id != variant_id
                )
            ).first()
            if existing:
                raise ConflictException(f"Вариант с SKU {update_dict['sku']} уже существует")
        
        for key, value in update_dict.items():
            setattr(variant, key, value)
        
        db.commit()
        db.refresh(variant)
        
        return variant
    
    @staticmethod
    def toggle_favorite(db: Session, item_id: int, user_id: int) -> Dict[str, Any]:
        """Добавить/удалить товар из избранного."""
        item = db.query(Item).filter(Item.id == item_id).first()
        
        if not item:
            raise NotFoundException("Товар не найден")
        
        user = db.query(User).filter(User.id == user_id).first()
        
        if item in user.favorites:
            user.favorites.remove(item)
            is_favorite = False
        else:
            user.favorites.append(item)
            is_favorite = True
        
        db.commit()
        
        return {
            "is_favorite": is_favorite,
            "item_id": item_id
        }
    
    @staticmethod
    def _create_variant(
        db: Session,
        item_id: int,
        variant_data: VariantCreate
    ) -> ItemVariant:
        """Внутренний метод создания варианта."""
        # Генерация SKU если не указан
        if not variant_data.sku:
            variant_data.sku = generate_sku(f"VAR-{item_id}")
        
        # Проверка уникальности SKU
        existing = db.query(ItemVariant).filter(
            ItemVariant.sku == variant_data.sku
        ).first()
        if existing:
            raise ConflictException(f"Вариант с SKU {variant_data.sku} уже существует")
        
        variant_dict = variant_data.dict(exclude={"images"})
        variant_dict["item_id"] = item_id
        
        variant = ItemVariant(**variant_dict)
        db.add(variant)
        db.flush()
        
        # Добавление изображений варианта
        if hasattr(variant_data, "images") and variant_data.images:
            for idx, image_data in enumerate(variant_data.images):
                image = VariantImage(
                    variant_id=variant.id,
                    image_url=image_data.url,
                    thumbnail_url=image_data.thumbnail_url,
                    alt_text=image_data.alt_text,
                    order=idx
                )
                db.add(image)
        
        db.commit()
        db.refresh(variant)
        
        return variant
    
    @staticmethod
    def _get_aggregations(db: Session, base_filters: Dict[str, Any]) -> Dict[str, Any]:
        """Получить агрегации для фильтров."""
        # Базовый запрос с фильтрами
        base_query = db.query(Item)
        for key, value in base_filters.items():
            if value is not None:
                base_query = base_query.filter(getattr(Item, key) == value)
        
        # Агрегация по брендам
        brands = db.query(
            Item.brand,
            func.count(Item.id).label("count")
        ).filter(
            Item.brand.isnot(None)
        ).group_by(Item.brand).all()
        
        # Агрегация по стилям
        styles = db.query(
            Item.style,
            func.count(Item.id).label("count")
        ).filter(
            Item.style.isnot(None)
        ).group_by(Item.style).all()
        
        # Агрегация по цветам через варианты
        colors = db.query(
            ItemVariant.color,
            func.count(func.distinct(ItemVariant.item_id)).label("count")
        ).join(Item).filter(
            and_(
                ItemVariant.color.isnot(None),
                ItemVariant.is_active == True,
                Item.is_active == True
            )
        ).group_by(ItemVariant.color).all()
        
        # Агрегация по размерам через варианты
        sizes = db.query(
            ItemVariant.size,
            func.count(func.distinct(ItemVariant.item_id)).label("count")
        ).join(Item).filter(
            and_(
                ItemVariant.size.isnot(None),
                ItemVariant.is_active == True,
                Item.is_active == True
            )
        ).group_by(ItemVariant.size).all()
        
        # Диапазон цен
        price_range = db.query(
            func.min(
                case(
                    (ItemVariant.discount_price.isnot(None), ItemVariant.discount_price),
                    else_=ItemVariant.price
                )
            ).label('min_price'),
            func.max(
                case(
                    (ItemVariant.discount_price.isnot(None), ItemVariant.discount_price),
                    else_=ItemVariant.price
                )
            ).label('max_price')
        ).join(Item).filter(
            and_(
                ItemVariant.is_active == True,
                Item.is_active == True
            )
        ).first()
        
        return {
            "brands": [{"value": b[0], "count": b[1]} for b in brands],
            "styles": [{"value": s[0], "count": s[1]} for s in styles],
            "colors": [{"value": c[0], "count": c[1]} for c in colors],
            "sizes": [{"value": s[0], "count": s[1]} for s in sizes],
            "price_range": {
                "min": price_range.min_price if price_range else 0,
                "max": price_range.max_price if price_range else 0
            }
        } 