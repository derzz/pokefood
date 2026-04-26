from pydantic import BaseModel, Field

from models.pokefood import Pokefood


class PokefoodFromImageRequest(BaseModel):
    image_base64: str = Field(..., min_length=4)


class MiguCreateRequest(BaseModel):
    image_base64: str = Field(..., min_length=4)


class PokefoodFromImageResponse(BaseModel):
    pokefood: Pokefood
    stored_pokefood_id: int
    source_confidence: float = 1.0
