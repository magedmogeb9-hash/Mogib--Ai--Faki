"""
نقطة الدخول الرئيسية - منصة AI Training Orchestrator
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.api.v1.router import api_router
from app.db.session import Base, engine

# إنشاء الجداول تلقائيًا عند أول تشغيل (في الإنتاج يُفضّل استخدام Alembic migrations فقط)
Base.metadata.create_all(bind=engine)

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="منصة شاملة لتخطيط وإدارة وتنفيذ تدريب نماذج الذكاء الاصطناعي",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/")
def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
