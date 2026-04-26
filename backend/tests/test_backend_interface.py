import uuid
import asyncio

import httpx
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

TEST_IMAGE_BASE64 = "aGVsbG8="


def _pokefood(name: str, personal_name: str, hp: int, pokefood_type: str) -> dict:
    return {
        "personal_name": personal_name,
        "name": name,
        "image_base64": TEST_IMAGE_BASE64,
        "labels": ["fresh", name],
        "hp": hp,
        "type": pokefood_type,
        "moves": [
            {"name": "Chop", "damage": 12},
            {"name": "Roast", "damage": 9},
        ],
    }


def _auth_headers(email: str | None = None) -> dict[str, str]:
    email = email or f"test-{uuid.uuid4().hex[:8]}@example.com"
    password = "secret123"

    register = client.post("/api/v1/auth/register", json={"email": email, "password": password})
    assert register.status_code == 201

    login = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_create_pokefood_from_image_mock() -> None:
    response = client.post(
        "/api/v1/pokefoods/from-image",
        json={"image_base64": TEST_IMAGE_BASE64},
        headers=_auth_headers(),
    )
    assert response.status_code == 200
    body = response.json()
    assert "pokefood" in body
    assert 0.0 <= body["source_confidence"] <= 1.0
    assert body["stored_pokefood_id"] > 0

    pokefood = body["pokefood"]
    assert {"personal_name", "name", "image_base64", "labels", "hp", "type", "moves"}.issubset(pokefood.keys())
    assert pokefood["image_base64"] == TEST_IMAGE_BASE64
    assert pokefood["hp"] >= 0
    assert len(pokefood["moves"]) <= 4


def test_websocket_battle_room_flow() -> None:
    with client.websocket_connect("/ws/battle/room-1?player_id=p1") as ws1:
        with client.websocket_connect("/ws/battle/room-1?player_id=p2") as ws2:
            ws1.send_json(
                {
                    "type": "join",
                    "payload": {
                        "pokefood": _pokefood(name="tofu", personal_name="Tofugeist", hp=65, pokefood_type="grain")
                    },
                }
            )
            ws2.send_json(
                {
                    "type": "join",
                    "payload": {
                        "pokefood": _pokefood(name="sushi", personal_name="Sushiking", hp=72, pokefood_type="meat")
                    },
                }
            )
            ws1.send_json({"type": "ready", "payload": {}})
            ws2.send_json({"type": "ready", "payload": {}})

            got_in_progress = False
            for _ in range(12):
                msg = ws1.receive_json()
                if msg.get("type") == "state_update" and msg.get("payload", {}).get("status") == "in_progress":
                    got_in_progress = True
                    break
            assert got_in_progress

            ws1.send_json({"type": "action", "payload": {"move": "Chop"}})
            saw_action_result = False
            for _ in range(8):
                msg = ws1.receive_json()
                if msg.get("type") == "action_result":
                    saw_action_result = True
                    assert msg["payload"]["damage"] >= 1
                    assert msg["payload"]["move"] == "Chop"
                    break
            assert saw_action_result


def test_matchmake_pairs_two_waiting_users() -> None:
    headers_a = _auth_headers(email=f"match-a-{uuid.uuid4().hex[:8]}@example.com")
    headers_b = _auth_headers(email=f"match-b-{uuid.uuid4().hex[:8]}@example.com")

    async def _create_matches() -> tuple[httpx.Response, httpx.Response]:
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as async_client:
            return await asyncio.gather(
                async_client.post("/api/v1/battles/matchmake", headers=headers_a),
                async_client.post("/api/v1/battles/matchmake", headers=headers_b),
            )

    match_a, match_b = asyncio.run(_create_matches())

    assert match_a.status_code == 200
    assert match_b.status_code == 200

    payload_a = match_a.json()
    payload_b = match_b.json()
    assert payload_a["mode"] == "matched"
    assert payload_b["mode"] == "matched"
    assert payload_a["room_id"] == payload_b["room_id"]
    assert payload_a["player_id"] == payload_b["opponent_id"]
    assert payload_b["player_id"] == payload_a["opponent_id"]



