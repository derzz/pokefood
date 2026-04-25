from __future__ import annotations

import asyncio
import random
import uuid
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
    websocket: Optional[WebSocket] = None
    ready: bool = False
    pokefood: Optional[Pokefood] = None
    current_hp: Optional[int] = None
    is_bot: bool = False


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

            existing_player = room.players.get(player_id)
            if existing_player:
                if existing_player.websocket is not None and existing_player.websocket is not websocket:
                    # Allow fast reconnects (e.g., React dev remount) by replacing stale socket.
                    try:
                        await existing_player.websocket.close(code=1012)
                    except Exception:
                        pass
                existing_player.websocket = websocket
                return

            if len(room.players) >= 2:
                raise RoomError("room already has 2 players")
            room.players[player_id] = PlayerState(websocket=websocket)

    async def disconnect(self, room_id: str, player_id: str, websocket: Optional[WebSocket] = None) -> None:
        async with self._lock:
            room = self.rooms.get(room_id)
            if not room:
                return

            player = room.players.get(player_id)
            if player is None:
                return

            if websocket is not None and player.websocket is not websocket:
                # A newer socket replaced this one; ignore stale disconnect callback.
                return

            room.players.pop(player_id, None)
            if not room.players or all(player.is_bot for player in room.players.values()):
                self.rooms.pop(room_id, None)
            elif room.status == "in_progress":
                room.status = "finished"

    async def create_mock_match(self, player_id: str) -> dict[str, str]:
        async with self._lock:
            room_id = f"room-{uuid.uuid4().hex[:12]}"
            bot_id = f"mock-{uuid.uuid4().hex[:8]}"
            bot_pokefood = self._generate_mock_pokefood()

            self.rooms[room_id] = RoomState(
                room_id=room_id,
                players={
                    player_id: PlayerState(),
                    bot_id: PlayerState(
                        ready=True,
                        pokefood=bot_pokefood,
                        current_hp=bot_pokefood.hp,
                        is_bot=True,
                    ),
                },
            )

            return {
                "room_id": room_id,
                "player_id": player_id,
                "opponent_id": bot_id,
            }

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
            return self._attack_locked(room=room, player_id=player_id, move_name=move_name)

    async def perform_bot_turn(self, room_id: str) -> Optional[dict]:
        async with self._lock:
            room = self._must_get_room(room_id)
            if room.status != "in_progress" or not room.turn_player_id:
                return None

            bot = room.players.get(room.turn_player_id)
            if not bot or not bot.is_bot or not bot.pokefood:
                return None

            chosen_move = random.choice(bot.pokefood.moves)
            return self._attack_locked(room=room, player_id=room.turn_player_id, move_name=chosen_move.name)

    def _attack_locked(self, room: RoomState, player_id: str, move_name: str) -> dict:
            if room.status != "in_progress":
                raise RoomError("battle not in progress")
            if room.turn_player_id != player_id:
                raise RoomError("not your turn")

            attacker = room.players.get(player_id)
            if attacker is None:
                raise RoomError("player not found in room")
            defender_id = next(pid for pid in room.players if pid != player_id)
            defender = room.players.get(defender_id)
            if defender is None:
                raise RoomError("defender not found in room")

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
        disconnected_ids: list[str] = []
        for player_id, player in room.players.items():
            websocket = player.websocket
            if websocket is None:
                continue
            try:
                await websocket.send_json(message)
            except Exception:
                disconnected_ids.append(player_id)

        if disconnected_ids:
            async with self._lock:
                latest_room = self.rooms.get(room_id)
                if not latest_room:
                    return
                for player_id in disconnected_ids:
                    player = latest_room.players.get(player_id)
                    if player:
                        player.websocket = None

    def _generate_mock_pokefood(self) -> Pokefood:
        candidates = [
            Pokefood(
                personal_name="Byte Burger",
                name="Burger",
                image_base64="aGVsbG8=",
                labels=["mock", "burger"],
                hp=74,
                type="meat",
                moves=[
                    {"name": "Grease Bash", "damage": 16},
                    {"name": "Patty Press", "damage": 12},
                ],
            ),
            Pokefood(
                personal_name="Kernel Knight",
                name="Corn",
                image_base64="aGVsbG8=",
                labels=["mock", "corn"],
                hp=70,
                type="grain",
                moves=[
                    {"name": "Cob Crush", "damage": 15},
                    {"name": "Starch Shield", "damage": 10},
                ],
            ),
            Pokefood(
                personal_name="Leaf Lancer",
                name="Salad",
                image_base64="aGVsbG8=",
                labels=["mock", "salad"],
                hp=68,
                type="fruveg",
                moves=[
                    {"name": "Vine Whip", "damage": 14},
                    {"name": "Citrus Slice", "damage": 11},
                ],
            ),
        ]
        return random.choice(candidates)

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
