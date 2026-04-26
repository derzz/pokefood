# 🍣 PokeFood

> Made for **Bearhacks 2026** — *nintendo plz don't sue ありがとうございます*

PokeFood turns your food photos into Pokémon-style creatures and lets you battle them against a friend in real time. Snap a picture of your meal, watch it get classified and transformed into a unique fighter with its own type, HP, and moves, then challenge another player to a WebSocket-powered battle.

---

## Features

- 📸 **Food-to-Fighter**: Upload or snap a photo of any food item; the ML backend classifies it and generates a unique "pokefood" with a name, type, HP, and moves.
- 🗂️ **Collection**: Each user account stores their own pokefood roster — collect as many as you eat.
- ⚔️ **Real-time Battles**: Two players join the same battle room over WebSockets and take turns attacking until one pokefood faints.
- 🔐 **Auth**: JWT-based registration & login. Two demo accounts (`test1@example.com` / `test2@example.com`, password `secret123`) are seeded automatically on first run.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS |
| Backend | FastAPI + SQLAlchemy (SQLite) + PyJWT |
| ML | OpenAI vision API + rembg background removal |
| Real-time | WebSockets (FastAPI) |

---

## Prerequisites

- **[uv](https://github.com/astral-sh/uv)** — Python package manager used by the backend
- **Node.js / npm** — used by the frontend

---

## Quick Start

### 1. Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

### 2. Set up backend environment variables

```bash
cp backend/.env.example backend/.env   # then fill in your OPENAI_API_KEY
```

### 3. Start both servers with `dev.sh`

```bash
./dev.sh
```

This single script starts:
- **Backend** on `http://127.0.0.1:8000` (FastAPI/uvicorn, auto-reload)
- **Frontend** on `http://localhost:5173` (Vite dev server)

Press **Ctrl+C** to stop both servers.

#### `dev.sh` options

| Flag | Description |
|------|-------------|
| `--reset-db` / `-r` | Delete the SQLite database before starting (fresh state) |
| `--yes` / `-y` | Auto-confirm prompts (e.g. kill a process already on port 8000) |
| `--help` / `-h` | Show usage |

---

## Battling with Two Users (Tunneling)

WebSocket battles require **both players to reach the same backend**. When playing across two different machines you need to expose your local backend over the internet with a tunneling service.

### Using [ngrok](https://ngrok.com/)

```bash
# In a separate terminal, after ./dev.sh is running
ngrok http 8000
```

ngrok will print a public URL such as `https://abc123.ngrok-free.app`. Share that URL with your opponent and make sure the frontend points to it (set `VITE_API_URL` in `frontend/.env` or update `src/constants.ts`).

### Using [localtunnel](https://theboroer.github.io/localtunnel-www/)

```bash
npx localtunnel --port 8000
```

### Alternative: Tailscale / direct LAN

If both players are on the same network you can simply use your local IP address (e.g. `http://192.168.x.x:8000`) without any tunnel.

---

## Project Structure

```
pokefood/
├── dev.sh            # One-command dev launcher
├── frontend/         # React + Vite app
│   └── src/
│       ├── screens/  # LoginScreen, RegisterScreen, HomeScreen, BattleScreen
│       └── ...
└── backend/
    ├── app/
    │   ├── api/      # REST endpoints (auth, pokefoods)
    │   ├── ws/       # WebSocket battle rooms
    │   ├── services/ # ML & game logic
    │   └── db/       # SQLAlchemy models & session
    └── ml/           # Food classification helpers
```

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/register` | Create account |
| `POST` | `/api/v1/auth/login` | Get JWT token |
| `POST` | `/api/v1/pokefoods/from-image` | Generate pokefood from base64 image |
| `GET`  | `/api/v1/pokefoods` | List your pokefoods |
| `GET`  | `/api/v1/pokefoods/{id}` | Get a specific pokefood |
| `WS`   | `/ws/battle/{room_id}?player_id=p1` | Join a battle room |

Interactive API docs are available at `http://127.0.0.1:8000/docs` while the backend is running.

---

*refer to patent: https://archive.org/details/12403397/page/n7/mode/2up*
