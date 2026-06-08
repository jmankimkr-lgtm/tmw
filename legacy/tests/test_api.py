from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import create_access_token, hash_password
from app.database import Base, get_db
from app.main import app
from app.models.user import User


@pytest.fixture()
def client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    db = TestingSessionLocal()
    db.add_all(
        [
            User(
                username="member1",
                name="Member One",
                role="member",
                hashed_pw=hash_password("Change1234!"),
            ),
            User(
                username="member2",
                name="Member Two",
                role="member",
                hashed_pw=hash_password("Change1234!"),
            ),
            User(
                username="admin",
                name="Admin",
                role="admin",
                hashed_pw=hash_password("AdminPass1!"),
            ),
        ]
    )
    db.commit()
    db.close()

    def override_get_db():
        test_db = TestingSessionLocal()
        try:
            yield test_db
        finally:
            test_db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def auth_headers(client: TestClient, username: str, password: str) -> dict[str, str]:
    response = client.post("/api/auth/login", json={"username": username, "password": password})
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_login_and_me(client):
    headers = auth_headers(client, "member1", "Change1234!")

    me = client.get("/api/auth/me", headers=headers)

    assert me.status_code == 200
    assert me.json()["username"] == "member1"
    assert me.json()["role"] == "member"


def test_invalid_login_returns_401(client):
    response = client.post(
        "/api/auth/login",
        json={"username": "member1", "password": "wrong-password"},
    )

    assert response.status_code == 401


def test_expired_token_returns_401(client):
    token = create_access_token({"sub": "1", "role": "member"}, expires_delta=timedelta(seconds=-1))

    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 401


def test_member_cannot_access_admin_dashboard(client):
    headers = auth_headers(client, "member1", "Change1234!")

    response = client.get("/api/admin/dashboard", headers=headers)

    assert response.status_code == 403


def test_planner_upsert_history_and_admin_dashboard(client):
    member_headers = auth_headers(client, "member1", "Change1234!")
    target_date = date.today().isoformat()
    payload = {
        "date": target_date,
        "one_win": "Finish the integration test",
        "tomorrow_1": "Run UAT",
        "brain_dumps": [{"seq": 1, "content": "Write tests"}],
        "big3_tasks": [
            {"seq": 1, "task": "API test", "detail_goal": "pass pytest", "is_done": True},
            {"seq": 2, "task": "Build check", "detail_goal": "pass frontend", "is_done": False},
        ],
        "time_blocks": [
            {"time_slot": "09:00-09:30", "task": "Test auth", "is_done": True},
        ],
    }

    created = client.post("/api/planners", json=payload, headers=member_headers)
    assert created.status_code == 200
    assert created.json()["one_win"] == "Finish the integration test"

    payload["one_win"] = "Updated one win"
    updated = client.post("/api/planners", json=payload, headers=member_headers)
    assert updated.status_code == 200
    assert updated.json()["one_win"] == "Updated one win"

    history = client.get(
        f"/api/planners?start={target_date}&end={target_date}",
        headers=member_headers,
    )
    assert history.status_code == 200
    assert history.json()[0]["big3_done"] == 1
    assert history.json()[0]["big3_total"] == 2

    admin_headers = auth_headers(client, "admin", "AdminPass1!")
    dashboard = client.get(f"/api/admin/dashboard?target_date={target_date}", headers=admin_headers)
    assert dashboard.status_code == 200
    assert dashboard.json()["written_count"] == 1
    assert dashboard.json()["total_count"] == 2
    assert any(member["has_planner"] is False for member in dashboard.json()["members"])


def test_update_me_validates_duplicate_username_and_current_password(client):
    headers = auth_headers(client, "member1", "Change1234!")

    duplicate = client.patch("/api/auth/me", json={"username": "member2"}, headers=headers)
    assert duplicate.status_code == 409

    wrong_password = client.patch(
        "/api/auth/me",
        json={"current_password": "wrong-password", "new_password": "NewPass123!"},
        headers=headers,
    )
    assert wrong_password.status_code == 400

    updated = client.patch(
        "/api/auth/me",
        json={"username": "member1-renamed", "name": "Renamed Member"},
        headers=headers,
    )
    assert updated.status_code == 200
    assert updated.json()["username"] == "member1-renamed"
    assert updated.json()["name"] == "Renamed Member"


def test_spa_routes_fallback_to_index(client):
    response = client.get("/planner")

    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]


def test_unknown_api_routes_still_return_404(client):
    response = client.get("/api/not-found")

    assert response.status_code == 404
