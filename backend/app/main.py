import os
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.pokefoods import router as pokefoods_router
from app.db.session import init_db
from app.ws.battle import router as battle_router

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

app = FastAPI(title="PokeFood Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("BACKEND_ALLOW_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Keep DB initialization eager so tests that instantiate TestClient globally still work.
init_db()


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    logger.info("backend startup complete", extra={"log_level": LOG_LEVEL})


app.include_router(auth_router)
app.include_router(pokefoods_router)
app.include_router(battle_router)


@app.get("/health")
async def health() -> dict:
    logger.info("health endpoint called")
    return {"status": "ok"}
