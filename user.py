"""
Schemas التحقق من بيانات المستخدم (طلبات/استجابات API)
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
import uuid
from app.models.user import SubscriptionPlan


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: Optional[str] = None
    company_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    company_name: Optional[str] = None


class APIKeysUpdate(BaseModel):
    """لتمكين المستخدم من ربط مفاتيحه الخاصة (اختياري)"""
    anthropic_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    github_token: Optional[str] = None


class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: Optional[str]
    company_name: Optional[str]
    is_active: bool
    is_verified: bool
    subscription_plan: SubscriptionPlan
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefreshRequest(BaseModel):
    refresh_token: str
