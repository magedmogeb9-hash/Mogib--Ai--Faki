"""
اختبارات أساسية - التحقق من تشغيل التطبيق ومساراته الجذرية
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "name" in data
    assert data["status"] == "running"


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_docs_available():
    response = client.get("/docs")
    assert response.status_code == 200


def test_register_and_login_flow():
    register_payload = {
        "email": "test_user@example.com",
        "password": "SecurePass123",
        "full_name": "مستخدم تجريبي",
    }
    register_response = client.post("/api/v1/auth/register", json=register_payload)
    assert register_response.status_code in (201, 400)  # 400 إن كان مسجلًا من تشغيل سابق

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": register_payload["email"], "password": register_payload["password"]},
    )
    assert login_response.status_code == 200
    assert "access_token" in login_response.json()


def test_protected_route_requires_auth():
    response = client.get("/api/v1/projects/")
    assert response.status_code == 401
