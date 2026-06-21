"""
مسارات رفع المشاريع إلى GitHub
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import uuid

from app.db.session import get_db
from app.models.user import User
from app.models.project import Project
from app.api.deps import get_current_user
from app.api.v1.endpoints.users import decrypt_user_key

router = APIRouter(prefix="/github", tags=["تكامل GitHub"])


class PushRequest(BaseModel):
    project_id: uuid.UUID
    repo_name: str
    private: bool = True


@router.post("/push")
def push_to_github(
    payload: PushRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.encrypted_github_token:
        raise HTTPException(
            status_code=400,
            detail="يرجى ربط توكن GitHub الخاص بك أولًا من صفحة الإعدادات",
        )

    project = (
        db.query(Project)
        .filter(Project.id == payload.project_id, Project.owner_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="المشروع غير موجود")

    github_token = decrypt_user_key(current_user.encrypted_github_token)

    from app.services.celery_tasks import push_project_to_github_task

    task = push_project_to_github_task.delay(
        str(project.id), github_token, payload.repo_name
    )

    return {"status": "تم بدء عملية الرفع", "task_id": task.id}
