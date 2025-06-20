from functools import lru_cache
from typing import List

from pydantic import BaseSettings, Field, validator


class Settings(BaseSettings):

    PROJECT_NAME: str = "TRC APP Backend API"
    BACKEND_CORS_ORIGINS: List[str] = ["*"]

    DATABASE_URL: str = Field("postgresql://postgres:postgres@db:5432/trcapp", env="DATABASE_URL")
    REDIS_URL: str = Field("redis://redis:6379/0", env="REDIS_URL")

    CELERY_BROKER_URL: str = Field("amqp://rabbitmq:5672//", env="CELERY_BROKER_URL")

    CLERK_API_KEY: str = Field("", env="CLERK_API_KEY")
    CLERK_DOMAIN: str = Field("", env="CLERK_DOMAIN")
    CLERK_FRONTEND_API: str = Field("", env="CLERK_FRONTEND_API")

    OPENAI_API_KEY: str = Field("", env="OPENAI_API_KEY")

    # Admins
    ADMIN_EMAILS: str = Field("", env="ADMIN_EMAILS")
    ADMIN_DEFAULT_PASSWORD: str = Field("tuka2005", env="ADMIN_DEFAULT_PASSWORD")

    # JWT auth
    SECRET_KEY: str = Field("CHANGE_ME_SECRET", env="SECRET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(60, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    # Refresh token validity period (in days)
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(14, env="REFRESH_TOKEN_EXPIRE_DAYS")

    # Google OAuth2
    GOOGLE_CLIENT_ID: str = Field("", env="GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET: str = Field("", env="GOOGLE_CLIENT_SECRET")
    GOOGLE_REDIRECT_URI: str = Field("http://localhost:8000/api/auth/google/callback", env="GOOGLE_REDIRECT_URI")

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache
def get_settings() -> Settings:
    """Cached settings to avoid re-reading on each access."""
    return Settings()
