from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, root_validator
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func, desc
from datetime import datetime

from app.core.database import get_db
from app.db.models.outfit import Outfit
from app.db.models.item import Item
from app.core.security import get_current_user, is_admin, get_current_user_optional
from app.db.models.user import User
from app.db.models.associations import user_favorite_outfits, OutfitView
from app.db.models.comment import Comment

router = APIRouter(
    prefix="/api/outfits",
    tags=["Outfits"]
)

class OutfitItemBase(BaseModel):
    id: int
    name: str
    brand: Optional[str] = None
    image_url: Optional[str] = None
    price: Optional[float] = None

    class Config:
        orm_mode = True

class OutfitCreate(BaseModel):
    name: str
    style: str
    description: Optional[str] = None
    top_ids: List[int] = []
    bottom_ids: List[int] = []
    footwear_ids: List[int] = []
    accessories_ids: List[int] = []
    fragrances_ids: List[int] = []

    @root_validator
    def _at_least_one_category(cls, values):
        if not any(values.get(field) for field in ["top_ids", "bottom_ids", "footwear_ids", 
                                                 "accessories_ids", "fragrances_ids"]):
            raise ValueError("At least one outfit category must contain items")
        return values

class OutfitUpdate(BaseModel):
    name: Optional[str] = None
    style: Optional[str] = None
    description: Optional[str] = None
    top_ids: Optional[List[int]] = None
    bottom_ids: Optional[List[int]] = None
    footwear_ids: Optional[List[int]] = None
    accessories_ids: Optional[List[int]] = None
    fragrances_ids: Optional[List[int]] = None

class OutfitOut(BaseModel):
    id: int
    name: str
    style: str
    description: Optional[str] = None
    owner_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    tops: List[OutfitItemBase] = []
    bottoms: List[OutfitItemBase] = []
    footwear: List[OutfitItemBase] = []
    accessories: List[OutfitItemBase] = []
    fragrances: List[OutfitItemBase] = []
    total_price: Optional[float] = None

    class Config:
        orm_mode = True

@router.post("/", response_model=OutfitOut, status_code=status.HTTP_201_CREATED)
def create_outfit(outfit_in: OutfitCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db_outfit = Outfit(
        name=outfit_in.name,
        style=outfit_in.style,
        description=outfit_in.description,
        owner_id=str(user.id)
    )
    
    for item_id in outfit_in.top_ids:
        item = db.get(Item, item_id)
        if item:
            db_outfit.tops.append(item)
    
    for item_id in outfit_in.bottom_ids:
        item = db.get(Item, item_id)
        if item:
            db_outfit.bottoms.append(item)
    
    for item_id in outfit_in.footwear_ids:
        item = db.get(Item, item_id)
        if item:
            db_outfit.footwear.append(item)
    
    for item_id in outfit_in.accessories_ids:
        item = db.get(Item, item_id)
        if item:
            db_outfit.accessories.append(item)
    
    for item_id in outfit_in.fragrances_ids:
        item = db.get(Item, item_id)
        if item:
            db_outfit.fragrances.append(item)
    
    db.add(db_outfit)
    db.commit()
    db.refresh(db_outfit)
    return _calculate_outfit_price(db_outfit)

@router.get("/", response_model=List[OutfitOut])
def list_outfits(
    skip: int = 0,
    limit: int = 100,
    q: Optional[str] = Query(None),
    style: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    sort_by: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional)
):
    query = db.query(Outfit)
    
    # If the caller is authenticated and not admin, show only their outfits. Otherwise (admin or anonymous) show all.
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
    
    if sort_by:
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

# ---------- Favorites & History (static routes placed BEFORE /{outfit_id} to avoid conflicts) ----------

@router.get("/favorites", response_model=List[OutfitOut])
def list_favorite_outfits(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return [_calculate_outfit_price(o) for o in user.favorite_outfits.all()]

@router.get("/history", response_model=List[OutfitOut])
def viewed_outfits(limit: int = 50, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
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

@router.delete("/history", status_code=status.HTTP_204_NO_CONTENT)
def clear_outfit_view_history(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    from app.db.models.associations import OutfitView
    db.query(OutfitView).filter(OutfitView.user_id == user.id).delete()
    db.commit()
    return None

@router.get("/{outfit_id}", response_model=OutfitOut)
def get_outfit(outfit_id: int, db: Session = Depends(get_db), user: Optional[User] = Depends(get_current_user_optional)):
    outfit = db.query(Outfit).filter(Outfit.id == outfit_id).first()
    if not outfit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Outfit not found")

    # Log view for authenticated users
    if user:
        db.add(OutfitView(user_id=user.id, outfit_id=outfit.id))
        db.commit()

    return _calculate_outfit_price(outfit)

@router.put("/{outfit_id}", response_model=OutfitOut)
def update_outfit(
    outfit_id: int,
    outfit_in: OutfitUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    outfit = db.query(Outfit).filter(Outfit.id == outfit_id).first()
    if not outfit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Outfit not found")
    _check_owner_or_admin(outfit, user)
    
    for field in ["name", "style", "description"]:
        if getattr(outfit_in, field) is not None:
            setattr(outfit, field, getattr(outfit_in, field))
    
    if outfit_in.top_ids is not None:
        outfit.tops = [item for item_id in outfit_in.top_ids if (item := db.get(Item, item_id))]
    
    if outfit_in.bottom_ids is not None:
        outfit.bottoms = [item for item_id in outfit_in.bottom_ids if (item := db.get(Item, item_id))]
    
    if outfit_in.footwear_ids is not None:
        outfit.footwear = [item for item_id in outfit_in.footwear_ids if (item := db.get(Item, item_id))]
    
    if outfit_in.accessories_ids is not None:
        outfit.accessories = [item for item_id in outfit_in.accessories_ids if (item := db.get(Item, item_id))]
    
    if outfit_in.fragrances_ids is not None:
        outfit.fragrances = [item for item_id in outfit_in.fragrances_ids if (item := db.get(Item, item_id))]
    
    db.commit()
    db.refresh(outfit)
    return _calculate_outfit_price(outfit)

@router.delete("/{outfit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_outfit(outfit_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    outfit = db.query(Outfit).filter(Outfit.id == outfit_id).first()
    if not outfit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Outfit not found")
    _check_owner_or_admin(outfit, user)
    
    db.delete(outfit)
    db.commit()
    return None

def _check_owner_or_admin(outfit: Outfit, user: Optional[User]):
    """Ensure the *user* is allowed to modify the *outfit*.

    If *user* is None (anonymous request) we raise 403 because modification endpoints always
    depend on authentication. For read-only endpoints we call this function conditionally.
    """
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    if is_admin(user):
        return
    if outfit.owner_id != str(user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

def _calculate_outfit_price(outfit: Outfit) -> OutfitOut:
    total_price = 0.0
    all_items = outfit.tops + outfit.bottoms + outfit.footwear + outfit.accessories + outfit.fragrances
    for item in all_items:
        if item.price:
            total_price += item.price
    
    outfit_out = OutfitOut.from_orm(outfit)
    outfit_out.total_price = total_price
    return outfit_out

def _price_in_range(price: Optional[float], min_price: Optional[float], max_price: Optional[float]) -> bool:
    if price is None:
        return False
    if min_price is not None and price < min_price:
        return False
    if max_price is not None and price > max_price:
        return False
    return True

# ---------- Trending Outfits ----------

@router.get("/trending", response_model=List[OutfitOut])
def trending_outfits(limit: int = 20, db: Session = Depends(get_db)):
    sub = (
        db.query(user_favorite_outfits.c.outfit_id, func.count(user_favorite_outfits.c.user_id).label("likes"))
        .group_by(user_favorite_outfits.c.outfit_id)
        .subquery()
    )
    query = (
        db.query(Outfit)
        .join(sub, Outfit.id == sub.c.outfit_id)
        .order_by(desc(sub.c.likes))
        .limit(limit)
    )
    outfits = query.all()
    return [_calculate_outfit_price(o) for o in outfits]

# ---------- Favorites Management ----------

@router.post("/{outfit_id}/favorite", status_code=status.HTTP_200_OK)
def toggle_favorite_outfit(outfit_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    outfit = db.get(Outfit, outfit_id)
    if not outfit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Outfit not found")
    if outfit in user.favorite_outfits:
        user.favorite_outfits.remove(outfit)
        db.commit()
        return {"favorited": False}
    else:
        user.favorite_outfits.append(outfit)
        db.commit()
        return {"favorited": True}

# ---------- Comments ----------

class OutfitCommentCreate(BaseModel):
    content: str
    rating: Optional[int] = None

class OutfitCommentOut(OutfitCommentCreate):
    id: int
    user_id: int
    created_at: Optional[datetime]
    likes: Optional[int] = 0

    class Config:
        orm_mode = True

@router.post("/{outfit_id}/comments", response_model=OutfitCommentOut, status_code=status.HTTP_201_CREATED)
def add_outfit_comment(outfit_id: int, payload: OutfitCommentCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    outfit = db.get(Outfit, outfit_id)
    if not outfit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Outfit not found")
    comment = Comment(user_id=user.id, outfit_id=outfit_id, content=payload.content, rating=payload.rating)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return _comment_with_likes(comment)

@router.get("/{outfit_id}/comments", response_model=List[OutfitCommentOut])
def list_outfit_comments(outfit_id: int, db: Session = Depends(get_db)):
    comments = db.query(Comment).filter(Comment.outfit_id == outfit_id).order_by(Comment.created_at.desc()).all()
    return [_comment_with_likes(c) for c in comments]

@router.post("/{outfit_id}/comments/{comment_id}/like", status_code=status.HTTP_200_OK)
def like_outfit_comment(outfit_id: int, comment_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    comment = db.query(Comment).filter(Comment.id == comment_id, Comment.outfit_id == outfit_id).first()
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

@router.delete("/{outfit_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_outfit_comment(
    outfit_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    comment = db.query(Comment).filter(Comment.id == comment_id, Comment.outfit_id == outfit_id).first()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

    if comment.user_id != user.id and not is_admin(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    db.delete(comment)
    db.commit()
    return None

def _comment_with_likes(comment: Comment):
    data = OutfitCommentOut.from_orm(comment)
    data.likes = comment.liked_by.count() if hasattr(comment.liked_by, 'count') else 0
    return data