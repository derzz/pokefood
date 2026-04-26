import logging
import asyncio

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from pydantic import ValidationError

from app.core.battle_runtime import room_manager
from app.core.room_manager import RoomError
from models.battle import WsEvent
from models import Pokefood

router = APIRouter(tags=["battle"])
logger = logging.getLogger(__name__)


async def _send_room_error(websocket: WebSocket, message: str, retryable: bool) -> None:
    await websocket.send_json(
        {
            "type": "error",
            "payload": {
                "code": "room_error",
                "retryable": retryable,
                "message": message,
            },
        }
    )


@router.websocket("/ws/battle/{room_id}")
async def battle_websocket(websocket: WebSocket, room_id: str, player_id: str = Query(...)) -> None:
    logger.info("battle.websocket connect", extra={"room_id": room_id, "player_id": player_id})
    await websocket.accept()

    try:
        await room_manager.connect(room_id=room_id, player_id=player_id, websocket=websocket)
    except RoomError as exc:
        logger.info(
            "battle.websocket rejected",
            extra={"room_id": room_id, "player_id": player_id, "error": str(exc)},
        )
        await _send_room_error(websocket, str(exc), retryable=False)
        await websocket.close(code=4400)
        return

    await room_manager.broadcast(
        room_id,
        {
            "type": "connected",
            "payload": {
                "room_id": room_id,
                "player_id": player_id,
            },
        },
    )
    snapshot = await room_manager.snapshot(room_id)
    if len(snapshot.players) == 2:
        opponent_id = next((pid for pid in snapshot.players if pid != player_id), None)
        await websocket.send_json(
            {
                "type": "matched",
                "payload": {
                    "room_id": room_id,
                    "player_id": player_id,
                    "opponent_id": opponent_id,
                },
            }
        )
    await room_manager.broadcast(
        room_id,
        {"type": "state_update", "payload": snapshot.model_dump(mode="json")},
    )

    try:
        while True:
            event = WsEvent.model_validate(await websocket.receive_json())
            await _handle_event(room_id=room_id, player_id=player_id, event=event)
    except WebSocketDisconnect:
        logger.info("battle.websocket disconnect", extra={"room_id": room_id, "player_id": player_id})

        was_live_battle = False
        if room_id in room_manager.rooms:
            pre_disconnect_snapshot = await room_manager.snapshot(room_id)
            was_live_battle = pre_disconnect_snapshot.status == "in_progress" and len(pre_disconnect_snapshot.players) == 2

        await room_manager.disconnect(room_id=room_id, player_id=player_id, websocket=websocket)

        if room_id in room_manager.rooms:
            snapshot = await room_manager.snapshot(room_id)

            if was_live_battle and len(snapshot.players) == 1:
                await room_manager.broadcast(
                    room_id,
                    {
                        "type": "opponent_disconnected",
                        "payload": {
                            "player_id": player_id,
                            "message": "Opponent disconnected. Returning to collection shortly.",
                        },
                    },
                )

        await room_manager.broadcast(
            room_id,
            {
                "type": "state_update",
                "payload": snapshot.model_dump(mode="json") if room_id in room_manager.rooms else {},
            },
        )
    except RoomError as exc:
        logger.info(
            "battle.websocket room_error",
            extra={"room_id": room_id, "player_id": player_id, "error": str(exc)},
        )
        await _send_room_error(websocket, str(exc), retryable=False)
        await websocket.close(code=4400)


async def _handle_event(room_id: str, player_id: str, event: WsEvent) -> None:
    logger.info(
        "battle.websocket event",
        extra={"room_id": room_id, "player_id": player_id, "event_type": event.type},
    )
    if event.type == "join":
        payload = event.payload.get("pokefood", event.payload.get("monster", {}))
        pokefood = _parse_join_pokefood(payload)
        await room_manager.set_pokefood(room_id=room_id, player_id=player_id, pokefood=pokefood)
        await room_manager.broadcast(
            room_id,
            {"type": "state_update", "payload": (await room_manager.snapshot(room_id)).model_dump(mode="json")},
        )
        return

    if event.type == "ready":
        await room_manager.set_ready(room_id=room_id, player_id=player_id)
        await room_manager.broadcast(
            room_id,
            {"type": "state_update", "payload": (await room_manager.snapshot(room_id)).model_dump(mode="json")},
        )
        return

    if event.type == "action":
        move_name = event.payload.get("move")
        if not move_name:
            raise RoomError("action payload must include a move name")

        result = await room_manager.attack(room_id=room_id, player_id=player_id, move_name=move_name)
        await room_manager.broadcast(room_id, {"type": "action_result", "payload": result})
        await room_manager.broadcast(
            room_id,
            {"type": "state_update", "payload": (await room_manager.snapshot(room_id)).model_dump(mode="json")},
        )

        if result.get("winner_id"):
            await room_manager.broadcast(room_id, {"type": "battle_end", "payload": result})
            return

        bot_result = await room_manager.perform_bot_turn(room_id=room_id)
        if bot_result is not None:
            await asyncio.sleep(0.35)
            await room_manager.broadcast(room_id, {"type": "action_result", "payload": bot_result})
            await room_manager.broadcast(
                room_id,
                {"type": "state_update", "payload": (await room_manager.snapshot(room_id)).model_dump(mode="json")},
            )
            if bot_result.get("winner_id"):
                await room_manager.broadcast(room_id, {"type": "battle_end", "payload": bot_result})
        return

    if event.type == "ping":
        await room_manager.broadcast(room_id, {"type": "pong", "payload": {"player_id": player_id}})
        return

    raise RoomError(f"unknown event type: {event.type}")


def _parse_join_pokefood(pokefood_payload: dict) -> Pokefood:
    try:
        return Pokefood.model_validate(pokefood_payload)
    except ValidationError as exc:
        raise RoomError(f"invalid pokefood payload: {exc.errors()}") from exc
