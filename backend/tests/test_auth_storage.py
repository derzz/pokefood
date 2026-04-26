import uuid
import os

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

TEST_IMAGE_BASE64 = "aGVsbG8="
DUMMY_ACCOUNT_1_EMAIL = os.getenv("DUMMY_ACCOUNT_1_EMAIL", "test1@example.com").strip().lower()
DUMMY_ACCOUNT_1_PASSWORD = os.getenv("DUMMY_ACCOUNT_1_PASSWORD", "secret123")
DUMMY_ACCOUNT_2_EMAIL = os.getenv("DUMMY_ACCOUNT_2_EMAIL", "test2@example.com").strip().lower()
DUMMY_ACCOUNT_2_PASSWORD = os.getenv("DUMMY_ACCOUNT_2_PASSWORD", "secret123")


def _register_and_login() -> tuple[str, str]:
    email = f"acct-{uuid.uuid4().hex[:8]}@example.com"
    password = "secret123"

    register = client.post("/api/v1/auth/register", json={"email": email, "password": password})
    assert register.status_code == 201

    login = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200
    token = login.json()["access_token"]
    return email, token


def test_user_only_sees_their_own_pokefoods() -> None:
    _, token_a = _register_and_login()
    _, token_b = _register_and_login()

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    create_a = client.post(
        "/api/v1/pokefoods/from-image",
        json={"image_base64": TEST_IMAGE_BASE64},
        headers=headers_a,
    )
    assert create_a.status_code == 200
    pokefood_id_a = create_a.json()["stored_pokefood_id"]

    create_b = client.post(
        "/api/v1/pokefoods/from-image",
        json={"image_base64": "Zm9vYmFy"},
        headers=headers_b,
    )
    assert create_b.status_code == 200
    pokefood_id_b = create_b.json()["stored_pokefood_id"]

    list_a = client.get("/api/v1/pokefoods", headers=headers_a)
    assert list_a.status_code == 200
    ids_a = {item["id"] for item in list_a.json()}
    assert pokefood_id_a in ids_a
    assert pokefood_id_b not in ids_a

    list_b = client.get("/api/v1/pokefoods", headers=headers_b)
    assert list_b.status_code == 200
    ids_b = {item["id"] for item in list_b.json()}
    assert pokefood_id_b in ids_b
    assert pokefood_id_a not in ids_b


def test_get_all_alias_returns_authenticated_users_pokefoods() -> None:
    _, token = _register_and_login()
    headers = {"Authorization": f"Bearer {token}"}

    create = client.post(
        "/api/v1/pokefoods/from-image",
        json={"image_base64": TEST_IMAGE_BASE64},
        headers=headers,
    )
    assert create.status_code == 200
    created_id = create.json()["stored_pokefood_id"]

    response = client.get("/api/v1/pokefoods/all", headers=headers)
    assert response.status_code == 200
    ids = {item["id"] for item in response.json()}
    assert created_id in ids


def test_auth_required_for_pokefood_creation() -> None:
    response = client.post(
        "/api/v1/pokefoods/from-image",
        json={"image_base64": TEST_IMAGE_BASE64},
    )
    assert response.status_code == 401


def test_dummy_accounts_exist_on_startup() -> None:
    login_1 = client.post(
        "/api/v1/auth/login",
        json={"email": DUMMY_ACCOUNT_1_EMAIL, "password": DUMMY_ACCOUNT_1_PASSWORD},
    )
    assert login_1.status_code == 200

    login_2 = client.post(
        "/api/v1/auth/login",
        json={"email": DUMMY_ACCOUNT_2_EMAIL, "password": DUMMY_ACCOUNT_2_PASSWORD},
    )
    assert login_2.status_code == 200


