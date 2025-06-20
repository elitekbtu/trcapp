from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Depends

from app.api.items import router as items_router
from app.api.outfits import router as outfits_router
from app.api.users import router as users_router
from app.api.auth import router as auth_router
from app.api.profile import router as profile_router, ProfileOut
from app.api.user_content import router as user_content_router
from app.core.config import get_settings
from app.core.database import Base, engine
from app.core.security import get_current_user, get_password_hash
from app.db.models.user import User

settings = get_settings()

app = FastAPI(title=settings.PROJECT_NAME)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(items_router)
app.include_router(outfits_router)
app.include_router(users_router)
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(user_content_router)

# Create default admin user (first email from ADMIN_EMAILS, password from env ADMIN_DEFAULT_PASSWORD)
@app.on_event("startup")
def create_default_admin():
    from app.core.database import SessionLocal
    db = SessionLocal()
    admin_emails = settings.ADMIN_EMAILS.split(",") if settings.ADMIN_EMAILS else []
    if not admin_emails:
        db.close()
        return
    admin_email = admin_emails[0].strip().lower()
    if not admin_email:
        db.close()
        return
    try:
        user = db.query(User).filter(User.email == admin_email).first()
        if not user:
            password = settings.dict().get("ADMIN_DEFAULT_PASSWORD", "tuka2005")
            db.add(User(email=admin_email, hashed_password=get_password_hash(password), is_admin=True))
            db.commit()
    except Exception:
        # Таблица ещё не создана (миграции не применены)
        pass
    db.close()

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "Service is running"}

@app.get("/api/health/ready")
async def readiness_check():
    # Here you can add checks for database, redis, etc.
    return {"status": "ok", "message": "Service is ready"}

@app.get("/api/me", response_model=ProfileOut)
async def get_me(user: User = Depends(get_current_user)):
    return ProfileOut.from_orm(user)
