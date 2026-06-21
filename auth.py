"""
مسارات المصادقة: تسجيل حساب جديد، تسجيل الدخول، تجديد التوكن
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token, TokenRefreshRequest
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)

router = APIRouter(prefix="/auth", tags=["المصادقة"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="البريد الإلكتروني مستخدم بالفعل")

    user = User(
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
        company_name=user_in.company_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="بيانات الدخول غير صحيحة")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="الحساب غير مفعّل")

    return Token(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/refresh", response_model=Token)
def refresh_token(payload: TokenRefreshRequest, db: Session = Depends(get_db)):
    decoded = decode_token(payload.refresh_token)
    if not decoded or decoded.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="توكن التجديد غير صالح")

    user_id = decoded.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="المستخدم غير موجود")

    return Token(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )
