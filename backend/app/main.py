import os
import logging
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.battles import router as battles_router
from app.api.pokefoods import router as pokefoods_router
from app.db.session import init_db
from app.ws.battle import router as battle_router

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

LOG_LEVEL = os.getenv("APP_LOG_LEVEL", "INFO").upper()


def configure_logging() -> None:
    root_logger = logging.getLogger()

    if not root_logger.handlers:
        logging.basicConfig(
            level=LOG_LEVEL,
            format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
        )

    root_logger.setLevel(LOG_LEVEL)
    logging.getLogger("app").setLevel(LOG_LEVEL)


configure_logging()
logger = logging.getLogger(__name__)


def _parse_allowed_origins(raw_origins: str | None) -> list[str]:
    if not raw_origins:
        return [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]

    origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
    return origins or [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


def _parse_allowed_origin_regex(raw_origin_regex: str | None) -> str | None:
    if not raw_origin_regex:
        return None
    normalized = raw_origin_regex.strip()
    return normalized or None


app = FastAPI(title="PokeFood Backend", version="0.1.0")

allowed_origins = _parse_allowed_origins(os.getenv("BACKEND_ALLOW_ORIGINS"))
allowed_origin_regex = _parse_allowed_origin_regex(os.getenv("BACKEND_ALLOW_ORIGIN_REGEX"))
allow_credentials = os.getenv("BACKEND_ALLOW_CREDENTIALS", "true").lower() == "true"

if "*" in allowed_origins and allow_credentials:
    logger.warning(
        "BACKEND_ALLOW_ORIGINS contains '*' while credentials are enabled; wildcard origin can break browser CORS checks. "
        "Use explicit origins and/or BACKEND_ALLOW_ORIGIN_REGEX instead."
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=allowed_origin_regex,
    allow_credentials=allow_credentials,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
        "Origin",
        "ngrok-skip-browser-warning",
    ],
)

logger.info(
    "cors configured",
    extra={
        "allowed_origins": allowed_origins,
        "allowed_origin_regex": allowed_origin_regex,
        "allow_credentials": allow_credentials,
    },
)

# Keep DB initialization eager so tests that instantiate TestClient globally still work.
init_db()


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    logger.info("backend startup complete", extra={"log_level": LOG_LEVEL})


app.include_router(auth_router)
app.include_router(battles_router)
app.include_router(pokefoods_router)
app.include_router(battle_router)


@app.get("/health")
async def health() -> dict:
    logger.info("health endpoint called")
    return {"status": "ok"}
