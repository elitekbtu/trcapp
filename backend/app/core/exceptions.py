"""Кастомные исключения для приложения."""

from typing import Optional, Any, Dict
from fastapi import HTTPException, status


class AppException(HTTPException):
    """Базовое исключение приложения."""
    
    def __init__(
        self,
        status_code: int,
        detail: str,
        headers: Optional[Dict[str, Any]] = None
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)


class NotFoundException(AppException):
    """Исключение для случаев, когда ресурс не найден."""
    
    def __init__(self, detail: str = "Ресурс не найден"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail
        )


class ValidationException(AppException):
    """Исключение для ошибок валидации."""
    
    def __init__(self, detail: str = "Ошибка валидации"):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail
        )


class UnauthorizedException(AppException):
    """Исключение для неавторизованного доступа."""
    
    def __init__(self, detail: str = "Требуется авторизация"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"}
        )


class ForbiddenException(AppException):
    """Исключение для запрещенного доступа."""
    
    def __init__(self, detail: str = "Доступ запрещен"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail
        )


class ConflictException(AppException):
    """Исключение для конфликтов."""
    
    def __init__(self, detail: str = "Конфликт данных"):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail
        )


class BadRequestException(AppException):
    """Исключение для некорректных запросов."""
    
    def __init__(self, detail: str = "Некорректный запрос"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        ) 