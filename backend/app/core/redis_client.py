from functools import lru_cache

import redis

from app.core.config import get_settings


@lru_cache(maxsize=None)
def get_redis():
    """Return a singleton Redis client configured from settings."""
    settings = get_settings()
    # decode_responses=True returns str instead of bytes
    return redis.from_url(settings.REDIS_URL, decode_responses=True) 