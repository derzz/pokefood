from pydantic import BaseModel, ConfigDict, Field

from models.constants import FoodType


class Move(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    damage: float
    bonus_dmg: float

    effective_types: list[FoodType]


class Pokefood(BaseModel):
    model_config = ConfigDict(extra="forbid")

    personal_name: str
    name: str
    image_base64: str = Field(..., min_length=4)
    labels: list[str]
    hp: int = Field(..., ge=0)
    atk: int = Field(..., ge=0)
    type: FoodType
    moves: list[Move] = Field(..., max_length=4)
    rarity: str = "common"
