"""Утилиты для приложения."""

import re
import unicodedata
from typing import Optional
from datetime import datetime, timedelta
import hashlib
import random
import string


def generate_slug(text: str) -> str:
    """Генерация slug из текста."""
    # Нормализация unicode
    text = unicodedata.normalize('NFKD', text)
    text = text.encode('ascii', 'ignore').decode('ascii')
    
    # Приведение к нижнему регистру
    text = text.lower()
    
    # Замена пробелов и специальных символов на дефисы
    text = re.sub(r'[^a-z0-9]+', '-', text)
    
    # Удаление дефисов в начале и конце
    text = text.strip('-')
    
    # Добавление случайного суффикса для уникальности
    suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    
    return f"{text}-{suffix}"


def generate_sku(prefix: str = "SKU") -> str:
    """Генерация уникального SKU."""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"{prefix}-{timestamp}-{random_part}"


def calculate_discount_percentage(original_price: float, discount_price: float) -> float:
    """Вычисление процента скидки."""
    if original_price <= 0:
        return 0
    
    discount = ((original_price - discount_price) / original_price) * 100
    return round(discount, 2)


def format_price(price: float) -> str:
    """Форматирование цены."""
    return f"{price:,.2f}"


def is_valid_email(email: str) -> bool:
    """Проверка валидности email."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def is_valid_phone(phone: str) -> bool:
    """Проверка валидности телефона."""
    # Удаляем все нецифровые символы
    digits = re.sub(r'\D', '', phone)
    
    # Проверяем длину (10-15 цифр)
    return 10 <= len(digits) <= 15


def generate_verification_code(length: int = 6) -> str:
    """Генерация кода верификации."""
    return ''.join(random.choices(string.digits, k=length))


def hash_password(password: str) -> str:
    """Хеширование пароля."""
    return hashlib.sha256(password.encode()).hexdigest()


def paginate_query(query, page: int = 1, per_page: int = 20):
    """Пагинация запроса SQLAlchemy."""
    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page
    }


def clean_html(html_text: str) -> str:
    """Очистка HTML тегов из текста."""
    clean = re.compile('<.*?>')
    return re.sub(clean, '', html_text)


def truncate_text(text: str, length: int = 100, suffix: str = "...") -> str:
    """Обрезка текста до указанной длины."""
    if len(text) <= length:
        return text
    
    return text[:length].rsplit(' ', 1)[0] + suffix


def calculate_reading_time(text: str, wpm: int = 200) -> int:
    """Вычисление времени чтения текста в минутах."""
    words = len(text.split())
    minutes = words / wpm
    return max(1, round(minutes))


def generate_order_number() -> str:
    """Генерация номера заказа."""
    timestamp = datetime.now().strftime("%Y%m%d")
    random_part = ''.join(random.choices(string.digits, k=6))
    return f"ORD-{timestamp}-{random_part}"


def calculate_delivery_date(days: int = 3) -> datetime:
    """Вычисление даты доставки."""
    return datetime.now() + timedelta(days=days)


def format_file_size(size_bytes: int) -> str:
    """Форматирование размера файла."""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} PB" 