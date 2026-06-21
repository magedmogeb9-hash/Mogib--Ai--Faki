"""
مهام Celery الخلفية: تشغيل عمليات التدريب الطويلة دون حجب الـ API
"""
import os
from datetime import datetime
from app.core.celery_app import celery_app
from app.core.config import settings
from app.db.session import SessionLocal
from app.models.training_job import TrainingJob, JobStatus


@celery_app.task(bind=True, name="run_training_job")
def run_training_job_task(self, job_id: str):
    """
    المهمة الرئيسية لتنفيذ تدريب نموذج في الخلفية.
    تُحدّث حالة المهمة في قاعدة البيانات بشكل مستمر لتتبع التقدّم من الواجهة.
    """
    from app.services.training_executor import run_local_finetune_job

    db = SessionLocal()
    job = db.query(TrainingJob).filter(TrainingJob.id == job_id).first()
    if not job:
        db.close()
        return {"error": "job not found"}

    try:
        job.status = JobStatus.RUNNING
        job.started_at = datetime.utcnow()
        job.celery_task_id = self.request.id
        db.commit()

        project = job.project
        output_dir = os.path.join(
            settings.TRAINING_OUTPUT_DIR, str(job.id)
        )

        metrics = run_local_finetune_job(
            job_id=str(job.id),
            base_model_id=project.base_model_id or "distilbert-base-multilingual-cased",
            dataset_path=job.hyperparameters.get("dataset_path", ""),
            output_dir=output_dir,
            hyperparameters=job.hyperparameters or {},
        )

        job.status = JobStatus.SUCCEEDED
        job.progress_percent = 100.0
        job.metrics = metrics
        job.finished_at = datetime.utcnow()
        job.logs_path = os.path.join(output_dir, "training.log")
        db.commit()

        return {"status": "succeeded", "metrics": metrics}

    except Exception as exc:
        job.status = JobStatus.FAILED
        job.error_message = str(exc)
        job.finished_at = datetime.utcnow()
        db.commit()
        raise
    finally:
        db.close()


@celery_app.task(name="push_project_to_github")
def push_project_to_github_task(project_id: str, user_github_token: str, repo_name: str):
    """رفع ملفات المشروع وملف النموذج الناتج إلى مستودع GitHub جديد أو موجود"""
    from app.services.github_service import push_project_files

    db = SessionLocal()
    try:
        from app.models.project import Project

        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return {"error": "project not found"}

        result = push_project_files(
            project=project,
            github_token=user_github_token,
            repo_name=repo_name,
        )

        project.github_repo_url = result["repo_url"]
        project.github_last_push_sha = result["commit_sha"]
        db.commit()

        return result
    finally:
        db.close()
