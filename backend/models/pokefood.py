from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class Move(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    damage: int


class Pokefood(BaseModel):
    model_config = ConfigDict(extra="forbid")

    personal_name: str
    name: str
    image_url: HttpUrl
    labels: list[str]
    hp: int = Field(..., ge=0)
    type: Literal["fruveg", "meat", "grain"]
    moves: list[Move] = Field(..., max_length=4)

