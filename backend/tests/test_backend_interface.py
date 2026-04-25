from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _pokefood(name: str, personal_name: str, hp: int, pokefood_type: str) -> dict:
    return {
        "personal_name": personal_name,
        "name": name,
        "image_url": "https://example.com/food.jpg",
        "labels": ["fresh", name],
        "hp": hp,
        "type": pokefood_type,
        "moves": [
            {"name": "Chop", "damage": 12},
            {"name": "Roast", "damage": 9},
        ],
    }


def test_create_monster_from_image_mock() -> None:
    response = client.post(
        "/api/v1/monsters/from-image",
        json={"bucket": "my-bucket", "object_path": "images/apple.jpg"},
    )
    assert response.status_code == 200
    body = response.json()
    assert "pokefood" in body
    assert 0.0 <= body["source_confidence"] <= 1.0

    pokefood = body["pokefood"]
    assert {"personal_name", "name", "image_url", "labels", "hp", "type", "moves"}.issubset(pokefood.keys())
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
            for _ in range(8):
                msg = ws1.receive_json()
                if msg.get("type") == "state_update" and msg.get("payload", {}).get("status") == "in_progress":
                    got_in_progress = True
                    break
            assert got_in_progress

            ws1.send_json({"type": "action", "payload": {"move": "Chop"}})
            saw_action_result = False
            for _ in range(6):
                msg = ws1.receive_json()
                if msg.get("type") == "action_result":
                    saw_action_result = True
                    assert msg["payload"]["damage"] >= 1
                    assert msg["payload"]["move"] == "Chop"
                    break
            assert saw_action_result

