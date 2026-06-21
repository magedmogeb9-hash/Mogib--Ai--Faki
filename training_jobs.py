"""
مسارات مهام التدريب: إطلاق تدريب فعلي، متابعة التقدّم، تحميل النتائج
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
import uuid
import os

from app.db.session import get_db
from app.models.user import User
from app.models.project import Project
from app.models.training_job import TrainingJob, JobStatus
from app.schemas.training_job import TrainingJobCreate, TrainingJobResponse
from app.api.deps import get_current_user
from app.core.config import settings

router = APIRouter(prefix="/training-jobs", tags=["مهام التدريب"])


@router.post("/", response_model=TrainingJobResponse, status_code=201)
def create_training_job(
    payload: TrainingJobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = (
        db.query(Project)
        .filter(Project.id == payload.project_id, Project.owner_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="المشروع غير موجود")

    hyperparams = payload.hyperparameters.model_dump()
    hyperparams["dataset_path"] = payload.dataset_path or payload.dataset_huggingface_id

    job = TrainingJob(
        project_id=project.id,
        owner_id=current_user.id,
        provider=payload.provider,
        hyperparameters=hyperparams,
        total_epochs=payload.hyperparameters.num_epochs,
        status=JobStatus.QUEUED,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # إطلاق المهمة في الخلفية عبر Celery (لا تحجب استجابة الـ API)
    from app.services.celery_tasks import run_training_job_task

    run_training_job_task.delay(str(job.id))

    return job


@router.get("/", response_model=List[TrainingJobResponse])
def list_my_jobs(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return db.query(TrainingJob).filter(TrainingJob.owner_id == current_user.id).all()


@router.get("/{job_id}", response_model=TrainingJobResponse)
def get_job(
    job_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = _get_owned_job(db, job_id, current_user)
    return job


@router.post("/{job_id}/cancel", response_model=TrainingJobResponse)
def cancel_job(
    job_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = _get_owned_job(db, job_id, current_user)
    if job.status in (JobStatus.SUCCEEDED, JobStatus.FAILED, JobStatus.CANCELLED):
        raise HTTPException(status_code=400, detail="لا يمكن إلغاء مهمة منتهية بالفعل")

    if job.celery_task_id:
        from app.core.celery_app import celery_app

        celery_app.control.revoke(job.celery_task_id, terminate=True)

    job.status = JobStatus.CANCELLED
    db.commit()
    db.refresh(job)
    return job


@router.get("/{job_id}/download")
def download_trained_model(
    job_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """يحزّم وينزّل النموذج المدرّب كملف ZIP قابل للتحميل مباشرة"""
    job = _get_owned_job(db, job_id, current_user)
    if job.status != JobStatus.SUCCEEDED:
        raise HTTPException(status_code=400, detail="المهمة لم تكتمل بنجاح بعد")

    from app.services.training_executor import package_model_for_download

    model_dir = job.metrics.get("model_output_path") if job.metrics else None
    if not model_dir or not os.path.exists(model_dir):
        raise HTTPException(status_code=404, detail="ملفات النموذج غير موجودة")

    zip_path = os.path.join(settings.TRAINING_OUTPUT_DIR, str(job.id), "model_package.zip")
    if not os.path.exists(zip_path):
        zip_path = package_model_for_download(model_dir, zip_path)

    return FileResponse(
        zip_path, media_type="application/zip", filename=f"model_{job.id}.zip"
    )


def _get_owned_job(db: Session, job_id: uuid.UUID, user: User) -> TrainingJob:
    job = (
        db.query(TrainingJob)
        .filter(TrainingJob.id == job_id, TrainingJob.owner_id == user.id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="مهمة التدريب غير موجودة")
    return job
