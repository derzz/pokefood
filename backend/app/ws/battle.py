from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from pydantic import ValidationError

from app.core.room_manager import RoomError, RoomManager
from models.battle import WsEvent
from models import Pokefood

router = APIRouter(tags=["battle"])
room_manager = RoomManager()


@router.websocket("/ws/battle/{room_id}")
async def battle_websocket(websocket: WebSocket, room_id: str, player_id: str = Query(...)) -> None:
    await websocket.accept()

    try:
        await room_manager.connect(room_id=room_id, player_id=player_id, websocket=websocket)
    except RoomError as exc:
        await websocket.send_json({"type": "error", "payload": {"message": str(exc)}})
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
    await room_manager.broadcast(
        room_id,
        {"type": "state_update", "payload": (await room_manager.snapshot(room_id)).model_dump(mode="json")},
    )

    try:
        while True:
            event = WsEvent.model_validate(await websocket.receive_json())
            await _handle_event(room_id=room_id, player_id=player_id, event=event)
    except WebSocketDisconnect:
        await room_manager.disconnect(room_id=room_id, player_id=player_id)
        await room_manager.broadcast(
            room_id,
            {
                "type": "state_update",
                "payload": (await room_manager.snapshot(room_id)).model_dump(mode="json") if room_id in room_manager.rooms else {},
            },
        )
    except RoomError as exc:
        await websocket.send_json({"type": "error", "payload": {"message": str(exc)}})


async def _handle_event(room_id: str, player_id: str, event: WsEvent) -> None:
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

    if event.type == "ping":
        await room_manager.broadcast(room_id, {"type": "pong", "payload": {"player_id": player_id}})
        return

    raise RoomError(f"unknown event type: {event.type}")


def _parse_join_pokefood(pokefood_payload: dict) -> Pokefood:
    try:
        return Pokefood.model_validate(pokefood_payload)
    except ValidationError as exc:
        raise RoomError(f"invalid pokefood payload: {exc.errors()}") from exc
