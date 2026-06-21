"""
تجميع كل مسارات API الإصدار v1 في راوتر واحد
"""
from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    users,
    projects,
    training_jobs,
    github,
    payments,
    contracts,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(projects.router)
api_router.include_router(training_jobs.router)
api_router.include_router(github.router)
api_router.include_router(payments.router)
api_router.include_router(contracts.router)
