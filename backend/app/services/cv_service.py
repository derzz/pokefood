import hashlib
from typing import Any, Dict, Optional, Tuple

import httpx

from models import Move, Pokefood


class CVService:
    def __init__(self, cv_service_url: Optional[str] = None, timeout_seconds: float = 5.0) -> None:
        self.cv_service_url = cv_service_url
        self.timeout_seconds = timeout_seconds

    async def get_pokefood(self, image_base64: str) -> Tuple[Pokefood, float]:
        if self.cv_service_url:
            return await self._get_from_http(image_base64=image_base64)
        return self._get_mock_pokefood(image_base64=image_base64)

    async def _get_from_http(self, image_base64: str) -> Tuple[Pokefood, float]:
        payload = {"image_base64": image_base64}
        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            response = await client.post(f"{self.cv_service_url.rstrip('/')}/getMonster", json=payload)
            response.raise_for_status()
            body: Dict[str, Any] = response.json()

        pokefood_data = body.get("pokefood", body.get("monster", body))
        confidence = float(body.get("source_confidence", body.get("confidence", 1.0)))
        pokefood = Pokefood.model_validate(pokefood_data)
        return pokefood, confidence

    def _get_mock_pokefood(self, image_base64: str) -> Tuple[Pokefood, float]:
        seed = int(hashlib.md5(image_base64.encode("utf-8")).hexdigest()[:8], 16)

        food_names = ["burger", "sushi", "broccoli", "tofu"]
        personal_names = ["Pikaberry", "Sushizard", "Broccolisaur", "Tofurtle"]
        pokefood_types = ["grain", "meat", "fruveg", "meat"]

        idx = seed % len(food_names)
        food_name = food_names[idx]
        personal_name = personal_names[idx]
        pokefood_type = pokefood_types[idx]
        hp = 60 + (seed % 61)

        # Keep move generation deterministic so tests and demos are repeatable.
        moves = [
            Move(name="Crunch", damage=8 + (seed % 8)),
            Move(name="Sear", damage=10 + ((seed // 7) % 10)),
            Move(name="Dash", damage=6 + ((seed // 13) % 6)),
        ]

        pokefood = Pokefood(
            personal_name=personal_name,
            name=food_name,
            image_base64=image_base64,
            labels=[food_name, pokefood_type, "mock"],
            hp=hp,
            type=pokefood_type,
            moves=moves,
        )
        return pokefood, 0.5
