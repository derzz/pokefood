from fastapi import FastAPI
from pydantic import BaseModel, Field, HttpUrl
from typing import Literal

app = FastAPI(title="FastAPI Starter", version="0.1.0")


@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "FastAPI starter is running"}


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


class Move(BaseModel):
    name: str
    damage: int


class Pokefood(BaseModel):
    personal_name: str
    name: str
    image_url: HttpUrl
    labels: list[str] = Field(default_factory=list)
    hp: int = Field(ge=0)
    type: Literal["fruveg", "meat", "grain"]
    moves: list[Move] = Field(default_factory=list, max_length=4)


@app.post("/generate-moves", response_model=Pokefood)
def pokefood_generation(food_name: String, name: String, labels: list[]) -> Pokefood:
    
    return pokefood
