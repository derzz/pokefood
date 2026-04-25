import hashlib
import logging
from typing import Any, Dict, Optional, Tuple

import httpx

from ml.main import generate_pokefood_and_icon
from models import Move, Pokefood

logger = logging.getLogger(__name__)

class CVService:
    def __init__(self, cv_service_url: Optional[str] = None, timeout_seconds: float = 5.0) -> None:
        self.cv_service_url = cv_service_url
        self.timeout_seconds = timeout_seconds

    async def get_pokefood(self, image_base64: str) -> Pokefood:
        if self.cv_service_url:
            logger.info("Fetching Pokefood")
            return await self._get_from_http(image_base64=image_base64)
        logger.info("Mocking Pokefood")
        return self._get_mock_pokefood(image_base64=image_base64)

    async def _get_from_http(self, image_base64: str) -> Pokefood:
        logger.info("CV pipeline starting (input_len=%d)", len(image_base64))
        try:
            pokefood_data = await generate_pokefood_and_icon(base64_image=image_base64)
        except Exception as exc:
            logger.exception("CV pipeline failed: %s", exc)
            raise
        logger.info(
            "CV pipeline succeeded: name=%r type=%r labels=%r moves=%d image_bytes=%d",
            pokefood_data.name,
            pokefood_data.type,
            pokefood_data.labels,
            len(pokefood_data.moves),
            len(pokefood_data.image_base64) if pokefood_data.image_base64 else 0,
        )
        return pokefood_data

    def _get_mock_pokefood(self, image_base64: str) -> Pokefood:
        logger.info("Get mock pokefood")
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
        return pokefood
