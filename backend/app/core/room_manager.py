from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from typing import Dict, Optional

from fastapi import WebSocket

from models.battle import BattleRoomSnapshot, PlayerSnapshot
from models import Pokefood


class RoomError(Exception):
    pass

# Simple type advantage system: fruveg > meat > grain > ...
TYPE_ADVANTAGE = {
    "fruveg": "meat",
    "meat": "grain",
    "grain": "fruveg",
}


@dataclass
class PlayerState:
    websocket: WebSocket
    ready: bool = False
    pokefood: Optional[Pokefood] = None
    current_hp: Optional[int] = None


@dataclass
class RoomState:
    room_id: str
    players: Dict[str, PlayerState] = field(default_factory=dict)
    status: str = "waiting"
    turn_player_id: Optional[str] = None


class RoomManager:
    def __init__(self):
        self.rooms: Dict[str, RoomState] = {}
        self._lock = asyncio.Lock()

    async def connect(self, room_id: str, player_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            room = self.rooms.setdefault(room_id, RoomState(room_id=room_id))
            if player_id in room.players:
                raise RoomError("player_id already connected")
            if len(room.players) >= 2:
                raise RoomError("room already has 2 players")
            room.players[player_id] = PlayerState(websocket=websocket)

    async def disconnect(self, room_id: str, player_id: str) -> None:
        async with self._lock:
            room = self.rooms.get(room_id)
            if not room:
                return
            room.players.pop(player_id, None)
            if not room.players:
                self.rooms.pop(room_id, None)
            elif room.status == "in_progress":
                room.status = "finished"

    async def set_pokefood(self, room_id: str, player_id: str, pokefood: Pokefood) -> None:
        async with self._lock:
            player = self._must_get_player(room_id, player_id)
            player.pokefood = pokefood
            player.current_hp = pokefood.hp

    async def set_ready(self, room_id: str, player_id: str) -> None:
        async with self._lock:
            room = self._must_get_room(room_id)
            player = self._must_get_player(room_id, player_id)
            player.ready = True

            if len(room.players) == 2 and all(p.ready and p.pokefood for p in room.players.values()):
                room.status = "in_progress"
                room.turn_player_id = next(iter(room.players))

    async def attack(self, room_id: str, player_id: str, move_name: str) -> dict:
        async with self._lock:
            room = self._must_get_room(room_id)
            if room.status != "in_progress":
                raise RoomError("battle not in progress")
            if room.turn_player_id != player_id:
                raise RoomError("not your turn")

            attacker = self._must_get_player(room_id, player_id)
            defender_id = next(pid for pid in room.players if pid != player_id)
            defender = self._must_get_player(room_id, defender_id)

            if not attacker.pokefood or not defender.pokefood:
                raise RoomError("both players must set pokefood first")

            move = next((m for m in attacker.pokefood.moves if m.name == move_name), None)
            if not move:
                raise RoomError("move not found in moveset")

            multiplier = self._type_multiplier(attacker.pokefood.type, defender.pokefood.type)
            damage = max(1, int(round(move.damage * multiplier)))
            defender.current_hp = max(0, (defender.current_hp or defender.pokefood.hp) - damage)

            winner_id = None
            if defender.current_hp <= 0:
                room.status = "finished"
                winner_id = player_id
            else:
                room.turn_player_id = defender_id

            return {
                "attacker_id": player_id,
                "defender_id": defender_id,
                "move": move.name,
                "type_multiplier": multiplier,
                "damage": damage,
                "winner_id": winner_id,
            }

    async def snapshot(self, room_id: str) -> BattleRoomSnapshot:
        async with self._lock:
            room = self._must_get_room(room_id)
            return self._snapshot_locked(room)

    async def broadcast(self, room_id: str, message: dict) -> None:
        room = self.rooms.get(room_id)
        if not room:
            return
        websockets = [player.websocket for player in room.players.values()]
        for websocket in websockets:
            await websocket.send_json(message)

    def _must_get_room(self, room_id: str) -> RoomState:
        room = self.rooms.get(room_id)
        if not room:
            raise RoomError("room not found")
        return room

    def _must_get_player(self, room_id: str, player_id: str) -> PlayerState:
        room = self._must_get_room(room_id)
        player = room.players.get(player_id)
        if not player:
            raise RoomError("player not found in room")
        return player

    def _type_multiplier(self, attacker_type: str, defender_type: str) -> float:
        if TYPE_ADVANTAGE.get(attacker_type) == defender_type:
            return 1.2
        if TYPE_ADVANTAGE.get(defender_type) == attacker_type:
            return 0.8
        return 1.0

    def _snapshot_locked(self, room: RoomState) -> BattleRoomSnapshot:
        players = {
            pid: PlayerSnapshot(
                player_id=pid,
                ready=state.ready,
                current_hp=state.current_hp,
                pokefood=state.pokefood,
            )
            for pid, state in room.players.items()
        }
        return BattleRoomSnapshot(
            room_id=room.room_id,
            status=room.status,
            turn_player_id=room.turn_player_id,
            players=players,
        )
