from typing import Optional
from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserMe(BaseModel):
    id: int
    username: str
    name: str
    role: str

    model_config = {"from_attributes": True}


class UpdateMeRequest(BaseModel):
    username: Optional[str] = None
    name: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None
