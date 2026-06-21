"""
Schemas للمشاريع وخطط التدريب
"""
from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime
import uuid
from app.models.project import ProjectStatus, ProjectType


class ProjectCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    description: Optional[str] = None
    project_type: ProjectType
    base_model_id: Optional[str] = None
    target_model_name: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None
    base_model_id: Optional[str] = None
    target_model_name: Optional[str] = None


class TrainingPlanRequest(BaseModel):
    """طلب توليد خطة تدريب ذكية تلقائيًا بناءً على الهدف"""
    goal_description: str = Field(
        ..., description="وصف الهدف من النموذج، مثال: نموذج لتصنيف نصوص عربية"
    )
    dataset_description: Optional[str] = None
    available_gpu: Optional[str] = Field(
        default=None, description="مثال: NVIDIA A100, RTX 4090, CPU only"
    )
    budget_usd: Optional[float] = None
    target_use_case: Optional[str] = None


class ProjectResponse(BaseModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    name: str
    description: Optional[str]
    project_type: ProjectType
    status: ProjectStatus
    training_plan: Optional[dict[str, Any]]
    base_model_id: Optional[str]
    target_model_name: Optional[str]
    github_repo_url: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
