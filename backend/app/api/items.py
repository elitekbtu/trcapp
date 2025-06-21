from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from uuid import uuid4
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from datetime import datetime
import os
from fastapi.encoders import jsonable_encoder
from app.core.redis_client import get_redis
import json

from app.core.database import get_db
from app.db.models.item import Item
from app.core.security import require_admin, get_current_user_optional, get_current_user
from app.db.models.user import User

router = APIRouter(
    prefix="/api/items",
    tags=["Items"]
)

class ItemCreate(BaseModel):
    # We keep this for OpenAPI docs when using JSON body, but creation endpoint now uses form fields
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
    image_urls: Optional[List[str]] = None

    class Config:
        orm_mode = True

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads/items")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Helper to save upload file
def _save_upload_file(upload: UploadFile, subdir: str = "") -> str:
    """Save uploaded file and return relative path accessible via /uploads."""
    filename = f"{uuid4().hex}_{upload.filename}"
    dir_path = os.path.join(UPLOAD_DIR, subdir) if subdir else UPLOAD_DIR
    os.makedirs(dir_path, exist_ok=True)
    file_path = os.path.join(dir_path, filename)
    with open(file_path, "wb") as f:
        f.write(upload.file.read())
    # Path to serve: /uploads/items/... (assuming FastAPI mounts /uploads)
    return f"/uploads/items/{subdir + '/' if subdir else ''}{filename}"

@router.post("/", response_model=ItemOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
async def create_item(
    name: str = Form(...),
    brand: Optional[str] = Form(None),
    color: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    price: Optional[float] = Form(None),
    category: Optional[str] = Form(None),
    article: Optional[str] = Form(None),
    size: Optional[str] = Form(None),
    style: Optional[str] = Form(None),
    collection: Optional[str] = Form(None),
    images: Optional[List[UploadFile]] = File(None),
    image_url: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    # Determine primary image_url as first uploaded file (if any)
    primary_image_url: Optional[str] = None
    image_urls: List[str] = []

    if images:
        for idx, upload in enumerate(images):
            url = _save_upload_file(upload)
            image_urls.append(url)
            if idx == 0:
                primary_image_url = url

    # If no uploaded images but direct URL provided
    if not primary_image_url and image_url:
        primary_image_url = image_url

    db_item = Item(
        name=name,
        brand=brand,
        color=color,
        image_url=primary_image_url,
        description=description,
        price=price,
        category=category,
        article=article,
        size=size,
        style=style,
        collection=collection,
    )

    db.add(db_item)
    db.commit()
    db.refresh(db_item)

    # Save image relations
    from app.db.models.item_image import ItemImage

    for position, url in enumerate(image_urls):
        db.add(ItemImage(item_id=db_item.id, image_url=url, position=position))
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


# ---------- Collections ----------

@router.get("/collections", response_model=List[ItemOut])
def items_by_collection(name: str, db: Session = Depends(get_db)):
    return db.query(Item).filter(Item.collection == name).all()

# ---------- Favorites & History (static routes placed BEFORE /{item_id} to avoid conflicts) ----------

@router.get("/favorites", response_model=List[ItemOut])
def list_favorite_items(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # user.favorites is a dynamic relationship
    return user.favorites.all()

@router.get("/history", response_model=List[ItemOut])
def viewed_items(limit: int = 50, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    from app.db.models.associations import UserView
    views = (
        db.query(UserView)
        .filter(UserView.user_id == user.id)
        .order_by(UserView.viewed_at.desc())
        .limit(limit)
        .all()
    )
    item_ids = [v.item_id for v in views]
    if not item_ids:
        return []
    return db.query(Item).filter(Item.id.in_(item_ids)).all()

# Очистка истории

@router.delete("/history", status_code=status.HTTP_204_NO_CONTENT)
def clear_view_history(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    from app.db.models.associations import UserView
    db.query(UserView).filter(UserView.user_id == user.id).delete()
    db.commit()
    return None

# ---------- Retrieve single item (kept below static routes to avoid conflicts) ----------

@router.get("/{item_id}", response_model=ItemOut)
def get_item(item_id: int, db: Session = Depends(get_db), current: Optional["User"] = Depends(get_current_user_optional)):
    redis_client = get_redis()
    cache_key = f"item:{item_id}"
    cached = redis_client.get(cache_key)
    if cached:
        # Redis stores strings, we need to load JSON to dict then parse via ItemOut
        return json.loads(cached)

    item = db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    # Log view history for authenticated users
    if current:
        from app.db.models.associations import UserView
        db.add(UserView(user_id=current.id, item_id=item.id))
        db.commit()

    # Cache encoded item (convert to json first)
    encoded = jsonable_encoder(ItemOut.from_orm(item))
    redis_client.setex(cache_key, 300, json.dumps(encoded))  # Cache for 5 minutes

    return encoded

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

# ---------- Favorites Management ----------

from app.db.models.associations import user_favorite_items


@router.post("/{item_id}/favorite", status_code=status.HTTP_200_OK)
def toggle_favorite_item(item_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    if item in user.favorites:
        user.favorites.remove(item)
        db.commit()
        return {"favorited": False}
    else:
        user.favorites.append(item)
        db.commit()
        return {"favorited": True}

# ---------- Comments ----------

from app.db.models.comment import Comment


class CommentCreate(BaseModel):
    content: str
    rating: Optional[int] = None  # 1-5

class CommentOut(CommentCreate):
    id: int
    user_id: int
    created_at: Optional[datetime]
    likes: Optional[int] = 0

    class Config:
        orm_mode = True


@router.post("/{item_id}/comments", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
def add_item_comment(item_id: int, payload: CommentCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    comment = Comment(user_id=user.id, item_id=item_id, content=payload.content, rating=payload.rating)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return _comment_with_likes(comment)


@router.get("/{item_id}/comments", response_model=List[CommentOut])
def list_item_comments(item_id: int, db: Session = Depends(get_db)):
    comments = db.query(Comment).filter(Comment.item_id == item_id).order_by(Comment.created_at.desc()).all()
    return [_comment_with_likes(c) for c in comments]


@router.post("/{item_id}/comments/{comment_id}/like", status_code=status.HTTP_200_OK)
def like_comment(item_id: int, comment_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    comment = db.query(Comment).filter(Comment.id == comment_id, Comment.item_id == item_id).first()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

    if comment in user.liked_comments:
        user.liked_comments.remove(comment)
        db.commit()
        return {"liked": False}
    else:
        user.liked_comments.append(comment)
        db.commit()
        return {"liked": True}


@router.delete("/{item_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item_comment(
    item_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    comment = db.query(Comment).filter(Comment.id == comment_id, Comment.item_id == item_id).first()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

    if comment.user_id != user.id and not is_admin(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    db.delete(comment)
    db.commit()
    return None

def _comment_with_likes(comment: Comment):
    # Helper to include likes count in response
    data = CommentOut.from_orm(comment)
    data.likes = comment.liked_by.count() if hasattr(comment.liked_by, 'count') else 0
    return data