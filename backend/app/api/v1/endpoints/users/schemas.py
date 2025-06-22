from typing import Optional
from pydantic import BaseModel, EmailStr


class UserCreateAdmin(BaseModel):
    email: EmailStr
    password: str
    is_admin: bool = False
    is_active: bool = True


class UserUpdateAdmin(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    is_admin: Optional[bool] = None
    is_active: Optional[bool] = None 