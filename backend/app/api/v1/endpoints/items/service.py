import os
import uuid
from typing import List, Optional
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func, desc

from app.db.models.item import Item
from app.db.models.user import User
from app.db.models.associations import user_favorite_items, UserView
from app.db.models.comment import Comment
from app.db.models.variant import ItemVariant
from app.db.models.item_image import ItemImage
from .schemas import ItemUpdate, VariantCreate, VariantUpdate, CommentCreate


UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads/items")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _save_upload_file(upload: UploadFile, subdir: str = "") -> str:
    """Save uploaded file and return relative path accessible via /uploads."""
    filename = f"{uuid.uuid4().hex}_{upload.filename}"
    dir_path = os.path.join(UPLOAD_DIR, subdir) if subdir else UPLOAD_DIR
    os.makedirs(dir_path, exist_ok=True)
    file_path = os.path.join(dir_path, filename)
    with open(file_path, "wb") as f:
        f.write(upload.file.read())
    return f"/uploads/items/{subdir + '/' if subdir else ''}{filename}"


def _remove_upload_file(url: str):
    """Remove file from filesystem based on its public URL path."""
    if not url or not url.startswith("/uploads/"):
        return
    # Convert URL path to filesystem path
    # Example: /uploads/items/file.jpg -> uploads/items/file.jpg
    fs_path = url.lstrip("/").replace("/", os.sep)
    if os.path.exists(fs_path):
        try:
            os.remove(fs_path)
        except OSError:
            pass


def _comment_with_likes(comment: Comment):
    # Helper to include likes count in response
    from .schemas import CommentOut
    out_comment = CommentOut.from_orm(comment)
    out_comment.likes = len(comment.likes)
    return out_comment


async def create_item(
    db: Session,
    name: str,
    brand: Optional[str],
    color: Optional[str],
    description: Optional[str],
    price: Optional[float],
    category: Optional[str],
    article: Optional[str],
    size: Optional[str],
    style: Optional[str],
    collection: Optional[str],
    images: Optional[List[UploadFile]],
    image_url: Optional[str],
):
    primary_image_url: Optional[str] = None
    image_urls: List[str] = []

    if images:
        for idx, upload in enumerate(images):
            url = _save_upload_file(upload)
            image_urls.append(url)
            if idx == 0:
                primary_image_url = url

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

    for position, url in enumerate(image_urls):
        db.add(ItemImage(item_id=db_item.id, image_url=url, position=position))
    db.commit()
    db.refresh(db_item)

    return db_item


def list_items(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    q: Optional[str] = None,
    category: Optional[str] = None,
    style: Optional[str] = None,
    collection: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    size: Optional[str] = None,
    sort_by: Optional[str] = None,
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

    return query.offset(skip).limit(limit).all()


def get_item(db: Session, item_id: int, current_user: Optional[User] = None):
    item = db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    if current_user:
        view = (
            db.query(UserView)
            .filter(UserView.user_id == current_user.id, UserView.item_id == item_id)
            .first()
        )
        if view:
            view.viewed_at = func.now()
        else:
            db.add(UserView(user_id=current_user.id, item_id=item_id))
        db.commit()
    return item


def update_item(db: Session, item_id: int, item_in: ItemUpdate):
    item = db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    update_data = item_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def delete_item(db: Session, item_id: int):
    item = db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    # Manually delete from association tables
    from app.db.models.outfit import (
        outfit_top_association,
        outfit_bottom_association,
        outfit_footwear_association,
        outfit_accessories_association,
        outfit_fragrances_association,
    )
    db.execute(outfit_top_association.delete().where(outfit_top_association.c.item_id == item_id))
    db.execute(outfit_bottom_association.delete().where(outfit_bottom_association.c.item_id == item_id))
    db.execute(outfit_footwear_association.delete().where(outfit_footwear_association.c.item_id == item_id))
    db.execute(outfit_accessories_association.delete().where(outfit_accessories_association.c.item_id == item_id))
    db.execute(outfit_fragrances_association.delete().where(outfit_fragrances_association.c.item_id == item_id))

    # Remove images
    for img in item.images:
        _remove_upload_file(img.image_url)
        db.delete(img)

    db.delete(item)
    db.commit()


def trending_items(db: Session, limit: int = 20):
    sub = (
        db.query(user_favorite_items.c.item_id, func.count(user_favorite_items.c.user_id).label("likes"))
        .group_by(user_favorite_items.c.item_id)
        .subquery()
    )
    query = (
        db.query(Item)
        .join(sub, Item.id == sub.c.item_id)
        .order_by(desc("likes"))
        .limit(limit)
    )
    return query.all()


def items_by_collection(db: Session, name: str):
    return db.query(Item).filter(Item.collection == name).all()


def list_favorite_items(db: Session, user: User):
    return user.favorites.all()


def viewed_items(db: Session, user: User, limit: int = 50):
    views = (
        db.query(UserView)
        .filter(UserView.user_id == user.id)
        .order_by(desc(UserView.viewed_at))
        .limit(limit)
        .all()
    )
    item_ids = [v.item_id for v in views]
    if not item_ids:
        return []
    return db.query(Item).filter(Item.id.in_(item_ids)).all()


def clear_view_history(db: Session, user: User):
    db.query(UserView).filter(UserView.user_id == user.id).delete()
    db.commit()


def similar_items(db: Session, item_id: int, limit: int = 10):
    target = db.get(Item, item_id)
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    query = db.query(Item).filter(Item.id != item_id)
    if target.category:
        query = query.filter(Item.category == target.category)
    if target.style:
        query = query.filter(Item.style == target.style)

    return query.limit(limit).all()


def toggle_favorite_item(db: Session, user: User, item_id: int):
    item = db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    
    fav = user.favorites.filter(user_favorite_items.c.item_id == item_id).first()

    if fav:
        user.favorites.remove(fav)
        message = "Removed from favorites"
    else:
        user.favorites.append(item)
        message = "Added to favorites"
    
    db.commit()
    return {"detail": message}


def add_item_comment(db: Session, user: User, item_id: int, payload: CommentCreate):
    item = db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    comment = Comment(**payload.dict(), user_id=user.id, item_id=item_id)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return _comment_with_likes(comment)


def list_item_comments(db: Session, item_id: int):
    comments = db.query(Comment).filter(Comment.item_id == item_id).all()
    return [_comment_with_likes(c) for c in comments]


def like_comment(db: Session, user: User, comment_id: int):
    comment = db.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    
    if user in comment.likes:
        comment.likes.remove(user)
        message = "Comment unliked"
    else:
        comment.likes.append(user)
        message = "Comment liked"
    
    db.commit()
    return {"detail": message}


def delete_item_comment(db: Session, user: User, comment_id: int):
    comment = db.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    
    from app.core.security import is_admin
    if comment.user_id != user.id and not is_admin(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        
    db.delete(comment)
    db.commit()


def list_variants(db: Session, item_id: int):
    item = db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    return item.variants


def create_variant(db: Session, item_id: int, payload: VariantCreate):
    item = db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    variant = ItemVariant(**payload.dict(), item_id=item_id)
    db.add(variant)
    db.commit()
    db.refresh(variant)
    return variant


def update_variant(db: Session, variant_id: int, payload: VariantUpdate):
    variant = db.get(ItemVariant, variant_id)
    if not variant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Variant not found")
    
    update_data = payload.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(variant, key, value)
        
    db.add(variant)
    db.commit()
    db.refresh(variant)
    return variant


def delete_variant(db: Session, variant_id: int):
    variant = db.get(ItemVariant, variant_id)
    if not variant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Variant not found")
    db.delete(variant)
    db.commit() 