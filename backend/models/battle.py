from typing import Dict, Literal, Optional

from pydantic import BaseModel, Field

from models.pokefood import Pokefood


class PlayerSnapshot(BaseModel):
    player_id: str
    ready: bool
    current_hp: Optional[int] = None
    pokefood: Optional[Pokefood] = None


class BattleRoomSnapshot(BaseModel):
    room_id: str
    status: Literal["waiting", "in_progress", "finished"]
    turn_player_id: Optional[str] = None
    players: Dict[str, PlayerSnapshot]


class WsEvent(BaseModel):
    type: str
    payload: dict = Field(default_factory=dict)


class MatchmakeResponse(BaseModel):
    room_id: str
    player_id: str
    opponent_id: str
    mode: Literal["mock"] = "mock"

