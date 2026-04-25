import base64
import logging
import os
from io import BytesIO

import aiohttp
from dotenv import load_dotenv
from PIL import Image

load_dotenv()

logger = logging.getLogger(__name__)

_VISION_API_URL = "https://vision.googleapis.com/v1/images:annotate"

_FOOD_OBJECT_NAMES = {
    "food", "dish", "meal", "plate", "bowl", "cuisine", "ingredient",
    "breakfast", "lunch", "dinner", "dessert", "snack", "drink", "beverage",
    "soup", "salad", "sandwich", "pizza", "burger", "pasta", "rice", "sushi",
    "steak", "seafood", "vegetable", "fruit",
}


class FoodDishNotDetectedError(Exception):
    def __init__(self, reason: str) -> None:
        self.reason = reason
        super().__init__(reason)


async def crop_food_dish(image_bytes: bytes) -> bytes:
    api_key = os.environ.get("GOOGLE_CLOUD_VISION_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_CLOUD_VISION_API_KEY not set")

    try:
        img = Image.open(BytesIO(image_bytes))
        img.verify()
        img = Image.open(BytesIO(image_bytes))
    except Exception as exc:
        raise ValueError("Cannot decode image bytes") from exc

    width, height = img.size

    # Cloud Vision only accepts JPEG, PNG, WebP, or GIF — re-encode if needed
    _SUPPORTED_FORMATS = {"JPEG", "PNG", "WEBP", "GIF"}
    if img.format not in _SUPPORTED_FORMATS:
        api_buf = BytesIO()
        img.convert("RGB").save(api_buf, format="JPEG", quality=95)
        api_image_bytes = api_buf.getvalue()
    else:
        api_image_bytes = image_bytes

    payload = {
        "requests": [{
            "image": {"content": base64.b64encode(api_image_bytes).decode()},
            "features": [{"type": "OBJECT_LOCALIZATION", "maxResults": 20}],
        }]
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(
            _VISION_API_URL,
            params={"key": api_key},
            json=payload,
        ) as resp:
            if resp.status != 200:
                body = await resp.text()
                raise RuntimeError(f"Vision API error {resp.status}: {body}")
            data = await resp.json()

    annotations = (
        data.get("responses", [{}])[0].get("localizedObjectAnnotations", [])
    )

    for a in annotations:
        logger.info("detected: %s (score=%.3f)", a.get("name"), a.get("score"))

    food_objects = annotations

    best = max(food_objects, key=lambda a: a["score"])
    vertices = best["boundingPoly"]["normalizedVertices"]

    xs = [v.get("x", 0.0) for v in vertices]
    ys = [v.get("y", 0.0) for v in vertices]
    x_min, x_max = max(0.0, min(xs)), min(1.0, max(xs))
    y_min, y_max = max(0.0, min(ys)), min(1.0, max(ys))

    if x_min >= x_max or y_min >= y_max:
        raise FoodDishNotDetectedError("Invalid bounding box returned by Vision API")

    left = int(x_min * width)
    top = int(y_min * height)
    right = int(x_max * width)
    bottom = int(y_max * height)

    cropped = img.crop((left, top, right, bottom))

    buf = BytesIO()
    if cropped.mode in ("RGBA", "LA", "PA"):
        cropped.save(buf, format="PNG")
    else:
        if cropped.mode != "RGB":
            cropped = cropped.convert("RGB")
        cropped.save(buf, format="JPEG", quality=92)

    return buf.getvalue()


if __name__ == "__main__":
    import asyncio
    from pathlib import Path

    logging.basicConfig(level=logging.INFO)

    async def _test() -> None:
        path = Path(__file__).parent / "chicken.png"
        image_bytes = path.read_bytes()
        result = await crop_food_dish(image_bytes)
        from PIL import Image as _Image
        cropped = _Image.open(BytesIO(result))
        print(f"Input:  {_Image.open(BytesIO(image_bytes)).size}")
        print(f"Output: {cropped.size}, {len(result)} bytes")
        out = path.with_name("chicken_cropped.jpg")
        out.write_bytes(result)
        print(f"Saved to {out}")

    asyncio.run(_test())
