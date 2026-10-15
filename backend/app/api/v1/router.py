from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    events,
    registrations,
    attendance,
    certificates,
    reports,
    feedback,
    ai_assistant,
    audit_logs,
    users
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(events.router)
api_router.include_router(registrations.router)
api_router.include_router(attendance.router)
api_router.include_router(certificates.router)
api_router.include_router(reports.router)
api_router.include_router(feedback.router)
api_router.include_router(ai_assistant.router)
api_router.include_router(audit_logs.router)
api_router.include_router(users.router)

