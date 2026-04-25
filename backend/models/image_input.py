from pydantic import BaseModel, Field

from models.pokefood import Pokefood


class PokefoodFromImageRequest(BaseModel):
    bucket: str = Field(..., min_length=3)
    object_path: str = Field(..., min_length=1)


class PokefoodFromImageResponse(BaseModel):
    pokefood: Pokefood
    source_confidence: float = Field(..., ge=0.0, le=1.0)
