import logging

from fastapi import APIRouter, Depends

from app.core.battle_runtime import room_manager
from app.core.security import get_current_user
from app.db.models import User
from models.battle import MatchmakeResponse

router = APIRouter(prefix="/api/v1/battles", tags=["battles"])
logger = logging.getLogger(__name__)


@router.post("/matchmake", response_model=MatchmakeResponse)
async def matchmake_players(current_user: User = Depends(get_current_user)) -> MatchmakeResponse:
    player_id = f"user-{current_user.id}"
    match = await room_manager.matchmake(player_id=player_id)
    logger.info(
        "battles.matchmake created",
        extra={"user_id": current_user.id, "room_id": match["room_id"], "opponent_id": match["opponent_id"]},
    )
    return MatchmakeResponse.model_validate(match)

