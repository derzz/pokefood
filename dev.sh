#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
RESET_DB=false

usage() {
  cat <<'EOF'
Usage: ./dev.sh [options]

Options:
  --reset-db, -r   Delete backend/*.db before starting servers
  --help, -h       Show this help message
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --reset-db|-r)
      RESET_DB=true
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
  uv run uvicorn app.main:app --reload --port 8000
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
