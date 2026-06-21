"""
مسارات إدارة المستخدم: الملف الشخصي، ربط مفاتيح API الخاصة (اختياري)
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from cryptography.fernet import Fernet
import base64
import hashlib

from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate, APIKeysUpdate
from app.api.deps import get_current_user
from app.core.config import settings

router = APIRouter(prefix="/users", tags=["المستخدمون"])


def _get_fernet() -> Fernet:
    """يشتق مفتاح تشفير ثابت من SECRET_KEY لتشفير مفاتيح API الخاصة بالمستخدمين قبل تخزينها"""
    key_bytes = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    return Fernet(base64.urlsafe_b64encode(key_bytes))


@router.get("/me", response_model=UserResponse)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_my_profile(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/me/api-keys")
def update_my_api_keys(
    payload: APIKeysUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    يسمح للمستخدم بربط مفاتيحه الخاصة (Anthropic / OpenAI / GitHub) بشكل اختياري.
    المفاتيح تُشفّر قبل الحفظ ولا تُعاد أبدًا كاملة في أي استجابة API.
    """
    fernet = _get_fernet()
    if payload.anthropic_api_key:
        current_user.encrypted_anthropic_key = fernet.encrypt(
            payload.anthropic_api_key.encode()
        ).decode()
    if payload.openai_api_key:
        current_user.encrypted_openai_key = fernet.encrypt(
            payload.openai_api_key.encode()
        ).decode()
    if payload.github_token:
        current_user.encrypted_github_token = fernet.encrypt(
            payload.github_token.encode()
        ).decode()

    db.commit()
    return {"status": "تم تحديث المفاتيح بنجاح"}


@router.get("/me/api-keys/status")
def get_api_keys_status(current_user: User = Depends(get_current_user)):
    """يُرجع فقط حالة ربط كل مفتاح (مربوط/غير مربوط) دون كشف القيم"""
    return {
        "anthropic_connected": bool(current_user.encrypted_anthropic_key),
        "openai_connected": bool(current_user.encrypted_openai_key),
        "github_connected": bool(current_user.encrypted_github_token),
    }


def decrypt_user_key(encrypted_value: str) -> str:
    fernet = _get_fernet()
    return fernet.decrypt(encrypted_value.encode()).decode()
