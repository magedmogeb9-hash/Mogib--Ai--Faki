"""
إعداد Celery لتشغيل مهام التدريب الطويلة في الخلفية
دون حجب طلبات API الرئيسية
"""
from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "ai_training_platform",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    worker_prefetch_multiplier=1,  # مهم لمهام التدريب الطويلة - مهمة واحدة بالتسلسل لكل عامل
)
