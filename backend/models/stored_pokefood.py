from datetime import datetime

from pydantic import BaseModel

from models.pokefood import Pokefood


class StoredPokefoodResponse(BaseModel):
    id: int
    created_at: datetime
    pokefood: Pokefood
