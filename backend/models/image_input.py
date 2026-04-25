from pydantic import BaseModel, Field

from models.pokefood import Pokefood


class PokefoodFromImageRequest(BaseModel):
    image_base64: str = Field(..., min_length=4)


class PokefoodFromImageResponse(BaseModel):
    pokefood: Pokefood
    source_confidence: float = Field(..., ge=0.0, le=1.0)
    stored_pokefood_id: int
