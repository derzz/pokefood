import asyncio
import os
from io import BytesIO

from openai import AsyncOpenAI
from PIL import Image

from .label import Labeler
from .mllm_client import MLLMClient
from .model import DEFAULT_FOOD_LABEL_SCHEMA, FoodLabelResult, FoodLabelSchema
from .separate import remove_background
from .vision import crop_food_dish


async def classify_and_iconify(
    image_bytes: bytes,
    schema: FoodLabelSchema = DEFAULT_FOOD_LABEL_SCHEMA,
) -> tuple[FoodLabelResult, bytes]:
    cropped = await crop_food_dish(image_bytes)

    fmt = (Image.open(BytesIO(cropped)).format or "JPEG").lower()
    mime = f"image/{fmt}"

    openai_client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
    mllm = MLLMClient(system_prompt="", model="gpt-4o-mini", client=openai_client)
    labeler = Labeler(mllm)

    label_result, icon_bytes = await asyncio.gather(
        labeler.label(schema, cropped, mime=mime),
        remove_background(cropped),
    )
    return label_result, icon_bytes


if __name__ == "__main__":
    import logging
    from pathlib import Path

    from dotenv import load_dotenv

    load_dotenv()
    logging.basicConfig(level=logging.INFO)

    async def _test() -> None:
        path = Path(__file__).parent / "chicken.png"
        result, icon = await classify_and_iconify(path.read_bytes())
        for entry in result.labels:
            print(f"{entry.category:20} {entry.label}")
        out = path.with_name("chicken_icon.png")
        out.write_bytes(icon)
        print(f"Saved icon to {out} ({len(icon)} bytes)")

    asyncio.run(_test())
