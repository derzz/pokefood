from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class Move(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    damage: int


class Pokefood(BaseModel):
    model_config = ConfigDict(extra="forbid")

    personal_name: str
    name: str
    image_base64: str = Field(..., min_length=4)
    labels: list[str]
    hp: int = Field(..., ge=0)
    type: Literal["meat", "grains", "fruits_vegetables"]
    moves: list[Move] = Field(..., max_length=4)
