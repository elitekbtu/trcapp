from typing import List, Optional
from fastapi import HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func, desc
from datetime import datetime, timedelta

from app.db.models.outfit import Outfit
from app.db.models.item import Item
from app.core.security import is_admin
from app.db.models.user import User
from app.db.models.associations import user_favorite_outfits, OutfitView
from app.db.models.comment import Comment
from .schemas import OutfitCreate, OutfitUpdate, OutfitOut, OutfitCommentCreate, OutfitCommentOut

CATEGORY_MAP = {
    "top_ids": ("Tops", "tops"),
    "bottom_ids": ("Bottoms", "bottoms"),
    "footwear_ids": ("Footwear", "footwear"),
    "accessories_ids": ("Accessories", "accessories"),
    "fragrances_ids": ("Fragrances", "fragrances"),
}


def _fetch_items_by_category(db: Session, ids: List[int], expected_category: str) -> List[Item]:
    if not ids:
        return []
    items = db.query(Item).filter(Item.id.in_(ids)).all()
    if len(items) != len(ids):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or more items not found")
    for item in items:
        if item.category != expected_category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Item {item.id} is not in category '{expected_category}'",
            )
    return items


def _check_owner_or_admin(outfit: Outfit, user: Optional[User]):
    if not user or (outfit.owner_id != str(user.id) and not is_admin(user)):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")


def _calculate_outfit_price(outfit: Outfit) -> OutfitOut:
    outfit_data = OutfitOut.from_orm(outfit).dict()
    total_price = sum(
        item.price
        for cat in ["tops", "bottoms", "footwear", "accessories", "fragrances"]
        for item in getattr(outfit, cat)
        if item.price is not None
    )
    outfit_data["total_price"] = total_price
    return OutfitOut(**outfit_data)


def _price_in_range(price: Optional[float], min_price: Optional[float], max_price: Optional[float]) -> bool:
    if price is None:
        return not min_price and not max_price
    if min_price is not None and price < min_price:
        return False
    if max_price is not None and price > max_price:
        return False
    return True


def _comment_with_likes(comment: Comment):
    out_comment = OutfitCommentOut.from_orm(comment)
    out_comment.likes = len(comment.likes)
    return out_comment


def create_outfit(db: Session, user: User, outfit_in: OutfitCreate):
    db_outfit = Outfit(
        name=outfit_in.name,
        style=outfit_in.style,
        description=outfit_in.description,
        collection=outfit_in.collection,
        owner_id=str(user.id)
    )

    for payload_field, (expected_category, rel_attr) in CATEGORY_MAP.items():
        ids = getattr(outfit_in, payload_field)
        items = _fetch_items_by_category(db, ids, expected_category)
        getattr(db_outfit, rel_attr).extend(items)

    if outfit_in.collection:
        for item in db_outfit.tops + db_outfit.bottoms + db_outfit.footwear + db_outfit.accessories + db_outfit.fragrances:
            if item.collection != outfit_in.collection:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Item {item.id} does not belong to collection '{outfit_in.collection}'",
                )

    db.add(db_outfit)
    db.commit()
    db.refresh(db_outfit)
    return _calculate_outfit_price(db_outfit)


def list_outfits(
    db: Session,
    user: Optional[User],
    skip: int = 0,
    limit: int = 100,
    q: Optional[str] = None,
    style: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    collection: Optional[str] = None,
    sort_by: Optional[str] = None,
):
    query = db.query(Outfit)

    if user is not None and not is_admin(user):
        query = query.filter(Outfit.owner_id == str(user.id))

    if q:
        search = f"%{q}%"
        query = query.filter(
            or_(
                Outfit.name.ilike(search),
                Outfit.description.ilike(search),
                Outfit.style.ilike(search)
            )
        )

    if style:
        query = query.filter(Outfit.style == style)

    if collection:
        query = query.filter(Outfit.collection == collection)

    if sort_by == "newest":
        query = query.order_by(Outfit.created_at.desc())

    outfits = query.offset(skip).limit(limit).all()
    result = []

    for outfit in outfits:
        outfit_out = _calculate_outfit_price(outfit)
        if _price_in_range(outfit_out.total_price, min_price, max_price):
            result.append(outfit_out)

    if sort_by in ["price_asc", "price_desc"]:
        result.sort(key=lambda x: x.total_price or 0, reverse=(sort_by == "price_desc"))

    return result


def list_favorite_outfits(db: Session, user: User):
    return [_calculate_outfit_price(o) for o in user.favorite_outfits.all()]


def viewed_outfits(db: Session, user: User, limit: int = 50):
    views = (
        db.query(OutfitView)
        .filter(OutfitView.user_id == user.id)
        .order_by(OutfitView.viewed_at.desc())
        .limit(limit)
        .all()
    )
    outfit_ids = [v.outfit_id for v in views]
    if not outfit_ids:
        return []
    outfits = db.query(Outfit).filter(Outfit.id.in_(outfit_ids)).all()
    return [_calculate_outfit_price(o) for o in outfits]


def clear_outfit_view_history(db: Session, user: User):
    db.query(OutfitView).filter(OutfitView.user_id == user.id).delete()
    db.commit()


def get_outfit(db: Session, outfit_id: int, user: Optional[User]):
    outfit = db.query(Outfit).filter(Outfit.id == outfit_id).first()
    if not outfit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Outfit not found")

    if user:
        db.add(OutfitView(user_id=user.id, outfit_id=outfit.id))
        db.commit()

    return _calculate_outfit_price(outfit)


def update_outfit(db: Session, user: User, outfit_id: int, outfit_in: OutfitUpdate):
    outfit = db.query(Outfit).filter(Outfit.id == outfit_id).first()
    if not outfit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Outfit not found")
    _check_owner_or_admin(outfit, user)

    collection_changed = False
    for field in ["name", "style", "description", "collection"]:
        val = getattr(outfit_in, field)
        if val is not None:
            setattr(outfit, field, val)
            if field == "collection":
                collection_changed = True

    for payload_field, (expected_category, rel_attr) in CATEGORY_MAP.items():
        ids = getattr(outfit_in, payload_field)
        if ids is not None:
            items = _fetch_items_by_category(db, ids, expected_category)
            setattr(outfit, rel_attr, items)

    if collection_changed and outfit.collection:
        for item in outfit.tops + outfit.bottoms + outfit.footwear + outfit.accessories + outfit.fragrances:
            if item.collection != outfit.collection:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Item {item.id} does not belong to collection '{outfit.collection}'",
                )
    
    db.add(outfit)
    db.commit()
    db.refresh(outfit)
    return _calculate_outfit_price(outfit)


def delete_outfit(db: Session, user: User, outfit_id: int):
    outfit = db.query(Outfit).filter(Outfit.id == outfit_id).first()
    if not outfit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Outfit not found")
    _check_owner_or_admin(outfit, user)
    db.delete(outfit)
    db.commit()


def trending_outfits(db: Session, limit: int = 20):
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    results = (
        db.query(Outfit, func.count(OutfitView.id).label("view_count"))
        .join(OutfitView, Outfit.id == OutfitView.outfit_id)
        .filter(OutfitView.viewed_at >= seven_days_ago)
        .group_by(Outfit.id)
        .order_by(desc("view_count"))
        .limit(limit)
        .all()
    )
    return [_calculate_outfit_price(outfit) for outfit, _ in results]


def toggle_favorite_outfit(db: Session, user: User, outfit_id: int):
    outfit = db.get(Outfit, outfit_id)
    if not outfit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Outfit not found")

    fav = user.favorite_outfits.filter(user_favorite_outfits.c.outfit_id == outfit_id).first()
    if fav:
        user.favorite_outfits.remove(fav)
        db.commit()
        return {"detail": "Removed from favorites"}
    else:
        user.favorite_outfits.append(outfit)
        db.commit()
        return {"detail": "Added to favorites"}


def add_outfit_comment(db: Session, user: User, outfit_id: int, payload: OutfitCommentCreate):
    outfit = db.get(Outfit, outfit_id)
    if not outfit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Outfit not found")
    comment = Comment(**payload.dict(), user_id=user.id, outfit_id=outfit_id)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return _comment_with_likes(comment)


def list_outfit_comments(db: Session, outfit_id: int):
    comments = db.query(Comment).filter(Comment.outfit_id == outfit_id).all()
    return [_comment_with_likes(c) for c in comments]


def like_outfit_comment(db: Session, user: User, comment_id: int):
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


def delete_outfit_comment(db: Session, user: User, comment_id: int):
    comment = db.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    
    if comment.user_id != user.id and not is_admin(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        
    db.delete(comment)
    db.commit() 