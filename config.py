"""
إعدادات النظام المركزية
كل القيم الحساسة تُقرأ من متغيرات البيئة (.env) ولا تُكتب مباشرة في الكود
"""
from pydantic_settings import BaseSettings
from typing import Optional, List
from functools import lru_cache


class Settings(BaseSettings):
    # ===== معلومات عامة =====
    APP_NAME: str = "AI Training Orchestrator Platform"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"  # development | staging | production
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # ===== الأمان =====
    SECRET_KEY: str = "CHANGE_THIS_SECRET_KEY_IN_PRODUCTION"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 ساعة
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # ===== قاعدة البيانات =====
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/ai_training_db"

    # ===== Redis / Celery (المهام الخلفية لتدريب النماذج) =====
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # ===== مزودو نماذج الذكاء الاصطناعي (اختيارية - يضعها كل مستخدم بمفتاحه الخاص) =====
    # المنصة لا تأتي بمفتاح مدفوع مجاني؛ كل مستخدم يربط مفتاحه الخاص إن أراد
    # استخدام نماذج تجارية. التدريب المحلي عبر Hugging Face لا يحتاج مفتاحًا مدفوعًا.
    ANTHROPIC_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    HUGGINGFACE_TOKEN: Optional[str] = None  # اختياري - فقط للنماذج المقيدة (gated models)

    # ===== التخزين (نماذج، بيانات، ملفات قابلة للتحميل) =====
    STORAGE_BACKEND: str = "local"  # local | s3
    LOCAL_STORAGE_PATH: str = "./storage"
    S3_BUCKET_NAME: Optional[str] = None
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"

    # ===== GitHub Integration =====
    GITHUB_APP_CLIENT_ID: Optional[str] = None
    GITHUB_APP_CLIENT_SECRET: Optional[str] = None
    GITHUB_DEFAULT_TOKEN: Optional[str] = None  # يمكن تجاوزه بتوكن المستخدم لكل عملية رفع

    # ===== الدفع - Stripe (يدعم بطاقات عالمية + Apple Pay + Google Pay) =====
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_PUBLISHABLE_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None

    # ===== الدفع - PayPal (تغطية إضافية لأسواق لا تفضل Stripe) =====
    PAYPAL_CLIENT_ID: Optional[str] = None
    PAYPAL_CLIENT_SECRET: Optional[str] = None
    PAYPAL_MODE: str = "sandbox"  # sandbox | live

    # ===== CORS =====
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    # ===== حدود الاستخدام (Rate Limiting) =====
    RATE_LIMIT_PER_MINUTE: int = 60

    # ===== التدريب المحلي (مجاني تمامًا، بدون أي مفتاح API) =====
    DEFAULT_LOCAL_MODEL_PROVIDER: str = "huggingface"
    MODELS_CACHE_DIR: str = "./storage/models_cache"
    DATASETS_CACHE_DIR: str = "./storage/datasets_cache"
    TRAINING_OUTPUT_DIR: str = "./storage/training_runs"

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
