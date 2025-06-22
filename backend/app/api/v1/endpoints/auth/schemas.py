from pydantic import BaseModel
from app.api.v1.endpoints.profile.schemas import ProfileOut


class UserCreate(BaseModel):
    email: str
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokensOut(TokenOut):
    refresh_token: str


class TokensUserOut(TokensOut):
    user: ProfileOut


class RefreshTokenIn(BaseModel):
    refresh_token: str 