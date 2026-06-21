"""
مسارات المشاريع: إنشاء مشاريع، توليد خطط تدريب ذكية، إدارة دورة الحياة
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.db.session import get_db
from app.models.user import User
from app.models.project import Project, ProjectStatus
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    TrainingPlanRequest,
)
from app.api.deps import get_current_user
from app.api.v1.endpoints.users import decrypt_user_key
from app.services.training_planner import (
    generate_training_plan_local,
    generate_training_plan_with_llm,
)

router = APIRouter(prefix="/projects", tags=["المشاريع"])


@router.post("/", response_model=ProjectResponse, status_code=201)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = Project(owner_id=current_user.id, **payload.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/", response_model=List[ProjectResponse])
def list_my_projects(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return db.query(Project).filter(Project.owner_id == current_user.id).all()


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = _get_owned_project(db, project_id, current_user)
    return project


@router.patch("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: uuid.UUID,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = _get_owned_project(db, project_id, current_user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=204)
def delete_project(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = _get_owned_project(db, project_id, current_user)
    db.delete(project)
    db.commit()


@router.post("/{project_id}/generate-plan", response_model=ProjectResponse)
async def generate_plan(
    project_id: uuid.UUID,
    payload: TrainingPlanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    يولّد خطة تدريب ذكية للمشروع.
    إن كان للمستخدم مفتاح Anthropic مربوط، يُستخدم لتخصيص أدق.
    وإلا، يعمل المحرك المحلي المجاني تلقائيًا (لا يتطلب أي اشتراك أو مفتاح).
    """
    project = _get_owned_project(db, project_id, current_user)

    user_key = None
    if current_user.encrypted_anthropic_key:
        try:
            user_key = decrypt_user_key(current_user.encrypted_anthropic_key)
        except Exception:
            user_key = None

    if user_key:
        plan = await generate_training_plan_with_llm(
            goal_description=payload.goal_description,
            user_anthropic_key=user_key,
            dataset_description=payload.dataset_description,
            available_gpu=payload.available_gpu,
            budget_usd=payload.budget_usd,
        )
    else:
        plan = generate_training_plan_local(
            goal_description=payload.goal_description,
            dataset_description=payload.dataset_description,
            available_gpu=payload.available_gpu,
            budget_usd=payload.budget_usd,
        )

    project.training_plan = plan
    project.status = ProjectStatus.PLANNING
    if not project.base_model_id and plan.get("recommended_base_models"):
        project.base_model_id = plan["recommended_base_models"][0]

    db.commit()
    db.refresh(project)
    return project


def _get_owned_project(db: Session, project_id: uuid.UUID, user: User) -> Project:
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.owner_id == user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="المشروع غير موجود")
    return project
