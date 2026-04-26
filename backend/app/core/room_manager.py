from __future__ import annotations

import asyncio
import random
import uuid
from collections import deque
from dataclasses import dataclass, field
from typing import Deque, Dict, Literal, Optional, cast

from fastapi import WebSocket

from models.battle import BattleRoomSnapshot, PlayerSnapshot
from models.constants import FoodType
from models.pokefood import Move, Pokefood


class RoomError(Exception):
    pass

# Simple type advantage system: fruits_vegetables > meat > grains > ...
TYPE_ADVANTAGE = {
    FoodType.FRUITS_VEGETABLES: FoodType.MEAT,
    FoodType.MEAT: FoodType.GRAINS,
    FoodType.GRAINS: FoodType.FRUITS_VEGETABLES,
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
    status: Literal["waiting", "in_progress", "finished"] = "waiting"
    turn_player_id: Optional[str] = None


@dataclass
class PendingMatchRequest:
    player_id: str
    future: asyncio.Future[dict[str, str]]
    loop: asyncio.AbstractEventLoop


class RoomManager:
    def __init__(self):
        self.rooms: Dict[str, RoomState] = {}
        self._lock = asyncio.Lock()
        self._waiting_match_requests: Deque[PendingMatchRequest] = deque()
        self._waiting_match_requests_by_player: Dict[str, PendingMatchRequest] = {}

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

    async def matchmake(self, player_id: str) -> dict[str, str]:
        loop = asyncio.get_running_loop()
        match_future = None
        response = None

        async with self._lock:
            # 1. Check if already in a room
            existing_room = self._find_room_for_player_locked(player_id)
            if existing_room is not None:
                existing_match = self._matchmake_response_for_player_locked(existing_room, player_id)
                if existing_match is not None:
                    return existing_match

                # Stale room with no opponent: drop membership so the player can rematch.
                existing_room.players.pop(player_id, None)
                if not existing_room.players:
                    self.rooms.pop(existing_room.room_id, None)

            # 2. Check if already waiting
            existing_request = self._waiting_match_requests_by_player.get(player_id)
            if existing_request is not None:
                match_future = existing_request.future
            else:
                # 3. Try to match with someone in queue
                while self._waiting_match_requests:
                    waiting_request = self._waiting_match_requests.popleft()
                    self._waiting_match_requests_by_player.pop(waiting_request.player_id, None)

                    if waiting_request.future.done():
                        continue

                    room_id = f"room-{uuid.uuid4().hex[:12]}"
                    self.rooms[room_id] = RoomState(
                        room_id=room_id,
                        players={
                            waiting_request.player_id: PlayerState(),
                            player_id: PlayerState(),
                        },
                    )

                    # Prepare response for the current player
                    response = {
                        "room_id": room_id,
                        "player_id": player_id,
                        "opponent_id": waiting_request.player_id,
                    }

                    # Signal the waiting player
                    waiting_response = {
                        "room_id": room_id,
                        "player_id": waiting_request.player_id,
                        "opponent_id": player_id,
                    }
                    waiting_request.future.set_result(waiting_response)

                    # Break out of the lock before returning
                    break

                    # 4. If no match found, become the waiting player
                if response is None and match_future is None:
                    match_future = loop.create_future()
                    pending_request = PendingMatchRequest(player_id=player_id, future=match_future, loop=loop)
                    self._waiting_match_requests.append(pending_request)
                    self._waiting_match_requests_by_player[player_id] = pending_request

        # --- LOCK RELEASED HERE ---

        if response:
            return response

        try:
            return await match_future
        except asyncio.CancelledError:
            async with self._lock:
                current_request = self._waiting_match_requests_by_player.pop(player_id, None)
                if current_request is not None:
                    try:
                        self._waiting_match_requests.remove(current_request)
                    except ValueError:
                        pass
            raise

    async def create_mock_match(self, player_id: str) -> dict[str, str]:
        return await self.matchmake(player_id=player_id)

    def _find_room_for_player_locked(self, player_id: str) -> Optional[RoomState]:
        for room in self.rooms.values():
            if player_id in room.players:
                return room
        return None

    def _matchmake_response_for_player_locked(self, room: RoomState, player_id: str) -> Optional[dict[str, str]]:
        opponent_id = next((pid for pid in room.players if pid != player_id), None)
        if opponent_id is None:
            return None
        return {
            "room_id": room.room_id,
            "player_id": player_id,
            "opponent_id": opponent_id,
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

            multiplier = move.bonus_dmg if defender.pokefood.type in move.effective_types else 0
            damage = max(1, int((move.damage + multiplier) * attacker.pokefood.atk))
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
        async with self._lock:
            room = self.rooms.get(room_id)
            if not room:
                return
            recipients = [
                (player_id, player.websocket)
                for player_id, player in room.players.items()
                if player.websocket is not None
            ]

        disconnected_ids: list[str] = []
        for player_id, websocket in recipients:
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
        burger_moves: list[Move] = [
            Move.model_validate({"name": "Grease Bash", "damage": 16}),
            Move.model_validate({"name": "Patty Press", "damage": 12}),
        ]
        corn_moves: list[Move] = [
            Move.model_validate({"name": "Cob Crush", "damage": 15}),
            Move.model_validate({"name": "Starch Shield", "damage": 10}),
        ]
        salad_moves: list[Move] = [
            Move.model_validate({"name": "Vine Whip", "damage": 14}),
            Move.model_validate({"name": "Citrus Slice", "damage": 11}),
        ]
        candidates = [
            Pokefood(
                personal_name="Byte Burger",
                name="Burger",
                image_base64="aGVsbG8=",
                labels=["mock", "burger"],
                hp=74,
                type=FoodType.MEAT,
                moves=burger_moves,
            ),
            Pokefood(
                personal_name="Kernel Knight",
                name="Corn",
                image_base64="aGVsbG8=",
                labels=["mock", "corn"],
                hp=70,
                type=FoodType.GRAINS,
                moves=corn_moves,
            ),
            Pokefood(
                personal_name="Leaf Lancer",
                name="Salad",
                image_base64="aGVsbG8=",
                labels=["mock", "salad"],
                hp=68,
                type=FoodType.FRUITS_VEGETABLES,
                moves=salad_moves,
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
            status=cast(Literal["waiting", "in_progress", "finished"], room.status),
            turn_player_id=room.turn_player_id,
            players=players,
        )
