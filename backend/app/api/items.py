from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from datetime import datetime

from app.core.database import get_db
from app.db.models.item import Item
from app.core.security import require_admin, get_current_user_optional
from app.db.models.user import User

router = APIRouter(
    prefix="/api/items",
    tags=["Items"]
)

class ItemCreate(BaseModel):
    name: str
    brand: Optional[str] = None
    color: Optional[str] = None
    image_url: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    article: Optional[str] = None
    size: Optional[str] = None
    style: Optional[str] = None
    collection: Optional[str] = None

class ItemUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    color: Optional[str] = None
    image_url: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    article: Optional[str] = None
    size: Optional[str] = None
    style: Optional[str] = None
    collection: Optional[str] = None

class ItemOut(ItemCreate):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    style: Optional[str] = None
    collection: Optional[str] = None

    class Config:
        orm_mode = True

@router.post("/", response_model=ItemOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
def create_item(item_in: ItemCreate, db: Session = Depends(get_db)):
    db_item = Item(**item_in.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("/", response_model=List[ItemOut])
def list_items(
    skip: int = 0,
    limit: int = 100,
    q: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    style: Optional[str] = Query(None),
    collection: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    size: Optional[str] = Query(None),
    sort_by: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Item)
    
    if q:
        search = f"%{q}%"
        query = query.filter(
            or_(
                Item.name.ilike(search),
                Item.description.ilike(search),
                Item.brand.ilike(search),
                Item.article.ilike(search)
            )
        )
    
    if category:
        query = query.filter(Item.category == category)
    
    if style:
        query = query.filter(Item.style == style)
    
    if collection:
        query = query.filter(Item.collection == collection)
    
    if min_price is not None or max_price is not None:
        if min_price is not None and max_price is not None:
            query = query.filter(and_(Item.price >= min_price, Item.price <= max_price))
        elif min_price is not None:
            query = query.filter(Item.price >= min_price)
        elif max_price is not None:
            query = query.filter(Item.price <= max_price)
    
    if size:
        query = query.filter(Item.size == size)
    
    if sort_by:
        if sort_by == "price_asc":
            query = query.order_by(Item.price.asc())
        elif sort_by == "price_desc":
            query = query.order_by(Item.price.desc())
        elif sort_by == "newest":
            query = query.order_by(Item.created_at.desc())
        elif sort_by == "trending":
            # Will be handled in /trending endpoint
            pass
    
    return query.offset(skip).limit(limit).all()

@router.get("/{item_id}", response_model=ItemOut)
def get_item(item_id: int, db: Session = Depends(get_db), current: Optional["User"] = Depends(get_current_user_optional)):
    item = db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    # Log view history for authenticated users
    if current:
        from app.db.models.associations import UserView
        db.add(UserView(user_id=current.id, item_id=item.id))
        db.commit()
    return item

@router.put("/{item_id}", response_model=ItemOut, dependencies=[Depends(require_admin)])
def update_item(item_id: int, item_in: ItemUpdate, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    
    update_data = item_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)
    
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
def delete_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    
    db.delete(item)
    db.commit()
    return None

# ---------- Trending items ----------

from sqlalchemy import func, desc
from app.db.models.associations import user_favorite_items


@router.get("/trending", response_model=List[ItemOut])
def trending_items(limit: int = 20, db: Session = Depends(get_db)):
    sub = (
        db.query(user_favorite_items.c.item_id, func.count(user_favorite_items.c.user_id).label("likes"))
        .group_by(user_favorite_items.c.item_id)
        .subquery()
    )
    query = (
        db.query(Item)
        .join(sub, Item.id == sub.c.item_id)
        .order_by(desc(sub.c.likes))
        .limit(limit)
    )
    return query.all()


# ---------- Similar items ----------

@router.get("/{item_id}/similar", response_model=List[ItemOut])
def similar_items(item_id: int, limit: int = 10, db: Session = Depends(get_db)):
    base_item = db.get(Item, item_id)
    if not base_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    query = db.query(Item).filter(Item.id != item_id)
    if base_item.category:
        query = query.filter(Item.category == base_item.category)
    if base_item.brand:
        query = query.filter(Item.brand == base_item.brand)
    if base_item.color:
        query = query.filter(Item.color == base_item.color)
    return query.limit(limit).all()


# ---------- Collections ----------

@router.get("/collections", response_model=List[ItemOut])
def items_by_collection(name: str, db: Session = Depends(get_db)):
    return db.query(Item).filter(Item.collection == name).all()