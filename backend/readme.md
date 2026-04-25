# PokeFood Backend Interface (MVP)

This backend exposes two integration interfaces for the project:

1. `POST /api/v1/monsters/from-image` to create a pokefood from an image in a GCP bucket.
2. `WS /ws/battle/{room_id}?player_id={player_id}` for 2-player room battle events.

## Quick start

```bash
cd /Users/vincentguo/PycharmProjects/pokefood/backend
/Users/vincentguo/Library/Python/3.9/bin/uv sync --dev
/Users/vincentguo/Library/Python/3.9/bin/uv run uvicorn app.main:app --reload --port 8000
```

## REST: Create Pokefood

- **Endpoint:** `POST /api/v1/monsters/from-image`
- **Request JSON:**

```json
{
  "bucket": "pokefood-images",
  "object_path": "uploads/bento_001.jpg"
}
```

- **Response JSON (CV schema + confidence):**

```json
{
  "pokefood": {
    "personal_name": "Sushizard",
    "name": "sushi",
    "image_url": "https://storage.googleapis.com/pokefood-images/uploads/bento_001.jpg",
    "labels": ["sushi", "meat", "mock"],
    "hp": 72,
    "type": "meat",
    "moves": [
      {"name": "Crunch", "damage": 12},
      {"name": "Sear", "damage": 16},
      {"name": "Dash", "damage": 9}
    ]
  },
  "source_confidence": 0.5
}
```

The `pokefood` object follows `ml/pokefood.json` and is the canonical model used across backend APIs and WebSocket battles.

By default, this uses a deterministic mock parser. To call CV directly:

```bash
export CV_SERVICE_URL="http://localhost:9000"
```

The backend then calls `POST $CV_SERVICE_URL/getMonster` with:

```json
{
  "bucket": "...",
  "object_path": "..."
}
```

## WebSocket: Battle Room

- **Endpoint:** `ws://localhost:8000/ws/battle/{room_id}?player_id=p1`
- **Room size:** exactly 2 players

### Client -> server events

- `join` (send a `pokefood` object)

```json
{
  "type": "join",
  "payload": {
    "pokefood": {
      "personal_name": "Sushizard",
      "name": "sushi",
      "image_url": "https://example.com/sushi.jpg",
      "labels": ["sushi", "meat"],
      "hp": 72,
      "type": "meat",
      "moves": [
        {"name": "Chop", "damage": 12},
        {"name": "Roast", "damage": 9}
      ]
    }
  }
}
```

- `ready`

```json
{"type": "ready", "payload": {}}
```

- `action` (send one move name from your pokefood moveset)

```json
{"type": "action", "payload": {"move": "Chop"}}
```

### Server -> client events

- `connected`
- `state_update`
- `action_result`
- `battle_end`
- `error`

## Tests

```bash
cd /Users/vincentguo/PycharmProjects/pokefood/backend
/Users/vincentguo/Library/Python/3.9/bin/uv run pytest -q
```
