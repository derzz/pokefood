import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.monsters import router as monsters_router
from app.ws.battle import router as battle_router

app = FastAPI(title="PokeFood Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("BACKEND_ALLOW_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(monsters_router)
app.include_router(battle_router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}

