"""
Schemas لمهام التدريب الفعلية
"""
from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime
import uuid
from app.models.training_job import JobStatus


class HyperParameters(BaseModel):
    learning_rate: float = 2e-5
    num_epochs: int = 3
    batch_size: int = 8
    max_seq_length: int = 512
    use_lora: bool = True
    lora_rank: int = 8
    gradient_accumulation_steps: int = 1
    warmup_ratio: float = 0.03


class TrainingJobCreate(BaseModel):
    project_id: uuid.UUID
    provider: str = "huggingface_local"  # huggingface_local | anthropic | openai
    hyperparameters: HyperParameters = HyperParameters()
    dataset_path: Optional[str] = None
    dataset_huggingface_id: Optional[str] = None


class TrainingJobResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    status: JobStatus
    provider: str
    hyperparameters: Optional[dict[str, Any]]
    progress_percent: float
    current_epoch: int
    total_epochs: Optional[int]
    metrics: Optional[dict[str, Any]]
    error_message: Optional[str]
    started_at: Optional[datetime]
    finished_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class TrainingJobLogChunk(BaseModel):
    job_id: uuid.UUID
    chunk: str
    timestamp: datetime
