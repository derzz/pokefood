#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
RESET_DB=false
ASSUME_YES=false
BACKEND_PORT=8000

usage() {
  cat <<'EOF'
Usage: ./dev.sh [options]

Options:
  --reset-db, -r   Delete backend/*.db before starting servers
  --yes, -y        Auto-confirm prompts (e.g., stop process on port 8000)
  --help, -h       Show this help message
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --reset-db|-r)
      RESET_DB=true
      shift
      ;;
    --yes|-y)
      ASSUME_YES=true
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Error: unknown option '$1'" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if ! command -v uv >/dev/null 2>&1; then
  echo "Error: uv is not installed or not in PATH." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is not installed or not in PATH." >&2
  exit 1
fi

if [[ ! -d "$BACKEND_DIR" || ! -d "$FRONTEND_DIR" ]]; then
  echo "Error: backend/ or frontend/ directory not found from $ROOT_DIR." >&2
  exit 1
fi

if [[ "$RESET_DB" == true ]]; then
  shopt -s nullglob
  db_files=("$BACKEND_DIR"/*.db)
  shopt -u nullglob

  if [[ ${#db_files[@]} -gt 0 ]]; then
    echo "Deleting database files in $BACKEND_DIR ..."
    rm -f "${db_files[@]}"
  else
    echo "No database files found in $BACKEND_DIR."
  fi
fi

existing_backend_pid="$(lsof -tiTCP:"$BACKEND_PORT" -sTCP:LISTEN 2>/dev/null | head -n 1 || true)"
if [[ -n "$existing_backend_pid" ]]; then
  existing_backend_cmd="$(ps -p "$existing_backend_pid" -ww -o command= 2>/dev/null || true)"
  echo "Port $BACKEND_PORT is already in use by PID $existing_backend_pid"
  if [[ -n "$existing_backend_cmd" ]]; then
    echo "Command: $existing_backend_cmd"
  fi

  should_kill="false"
  if [[ "$ASSUME_YES" == true ]]; then
    should_kill="true"
  elif [[ -t 0 ]]; then
    read -r -p "Stop this process and continue? [y/N] " reply
    if [[ "$reply" =~ ^[Yy]$ ]]; then
      should_kill="true"
    fi
  fi

  if [[ "$should_kill" != "true" ]]; then
    echo "Aborting start. Free port $BACKEND_PORT or run: ./dev.sh -y"
    exit 1
  fi

  kill "$existing_backend_pid" 2>/dev/null || true
  sleep 0.2
  if lsof -tiTCP:"$BACKEND_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Process on port $BACKEND_PORT did not stop gracefully. Forcing shutdown..."
    kill -9 "$existing_backend_pid" 2>/dev/null || true
  fi
fi

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo
  echo "Stopping dev servers..."

  if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi

  if [[ -n "$FRONTEND_PID" ]] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi

  wait 2>/dev/null || true
}

trap cleanup EXIT INT TERM

echo "Starting backend on http://127.0.0.1:8000 ..."
(
  cd "$BACKEND_DIR"
  uv run uvicorn app.main:app --reload --port "$BACKEND_PORT"
) &
BACKEND_PID=$!

echo "Starting frontend (Vite) ..."
(
  cd "$FRONTEND_DIR"
  npm run dev
) &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Press Ctrl+C to stop both servers."

wait "$BACKEND_PID" "$FRONTEND_PID"
