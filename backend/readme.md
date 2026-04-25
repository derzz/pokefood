# PokeFood Backend Interface (MVP)

This backend now supports user accounts, JWT auth, and per-user pokefood storage.

## Quick start

```bash
cd /Users/vincentguo/PycharmProjects/pokefood/backend
uv sync --dev
uv run uvicorn app.main:app --reload --port 8000
```

By default, data is persisted in SQLite at `backend/pokefood.db`.

## Authentication

### Register

- **Endpoint:** `POST /api/v1/auth/register`

```json
{
  "email": "ash@example.com",
  "password": "secret123"
}
```

### Login

- **Endpoint:** `POST /api/v1/auth/login`

```json
{
  "email": "ash@example.com",
  "password": "secret123"
}
```

- **Response:**

```json
{
  "access_token": "<jwt>",
  "token_type": "bearer"
}
```

Use this header on protected routes:

```text
Authorization: Bearer <jwt>
```

## Create Pokefood From Image (Protected)

- **Endpoint:** `POST /api/v1/pokefoods/from-image`
- **Auth:** required

```json
{
  "image_base64": "aGVsbG8="
}
```

```json
{
  "pokefood": {
    "personal_name": "Sushizard",
    "name": "sushi",
    "image_base64": "aGVsbG8=",
    "labels": ["sushi", "meat", "mock"],
    "hp": 72,
    "type": "meat",
    "moves": [
      {"name": "Crunch", "damage": 12},
      {"name": "Sear", "damage": 16}
    ]
  },
  "source_confidence": 0.5,
  "stored_pokefood_id": 12
}
```

The `pokefood` object follows the project schema with `image_base64` as the image field.

## My Stored Pokefoods (Protected)

### List mine

- **Endpoint:** `GET /api/v1/pokefoods`
- **Alias:** `GET /api/v1/pokefoods/all`

### Get one of mine

- **Endpoint:** `GET /api/v1/pokefoods/{pokefood_id}`

Stored pokefoods are saved with base64 image content (no bucket/object-path fields).

## WebSocket Battle Room

- **Endpoint:** `ws://localhost:8000/ws/battle/{room_id}?player_id=p1`
- **Room size:** exactly 2 players

Join with a `pokefood` payload and attack using one move name from its `moves` list.

## Tests

```bash
cd /Users/vincentguo/PycharmProjects/pokefood/backend
/Users/vincentguo/Library/Python/3.9/bin/uv run pytest -q
```
