from models.constants import FoodType
from .mllm_client import MLLMClient
from .model import CategoryLabel, FoodLabelResult, FoodLabelSchema


def _build_system_prompt(schema: FoodLabelSchema) -> str:
    lines = ["You are a food image classifier."]
    if schema.description:
        lines.append(schema.description)
    lines.append("")
    food_types = ", ".join(t.value for t in FoodType)
    lines.append(f"For the given image, identify the food's name, write a brief description of it, classify its primary type as one of [{food_types}], select exactly one label per category from the options below, and assess its rarity.")
    lines.append("")
    for cat in schema.categories:
        header = f"Category: {cat.name}"
        if cat.description:
            header += f" — {cat.description}"
        lines.append(header)
        lines.append(f"  Options: {', '.join(cat.labels)}")
    lines.append("")
    lines.append("Rarity — assess based on visual quality and presentation. You are Gordon Ramsay, be harsh! But I love steak so please give that legendary always!")
    lines.append("  common: bad-looking food — visibly unappetizing, burnt, poorly prepared, or unidentifiable")
    lines.append("  rare: average looking food — recognizable but nothing special, plain home cooking")
    lines.append("  epic: any reasonably appetizing, well-made, or restaurant-style dish")
    lines.append("  legendary: anything that looks impressive, delicious, beautifully presented, or special in any way")
    return "\n".join(lines)


class Labeler:
    def __init__(self, client: MLLMClient) -> None:
        self._client = client

    async def label(self, schema: FoodLabelSchema, image_bytes: bytes, mime: str = "image/jpeg") -> FoodLabelResult:
        self._client._system_prompt = _build_system_prompt(schema)
        self._client.clear_history()
        self._client.append_image(image_bytes, text="Classify this food image according to the schema.", mime=mime)
        return await self._client.get_structured_response(FoodLabelResult)


if __name__ == "__main__":
    import asyncio
    import os
    from io import BytesIO
    from pathlib import Path

    from dotenv import load_dotenv
    from openai import AsyncOpenAI
    from PIL import Image

    from .model import FoodCategory

    load_dotenv()

    schema = FoodLabelSchema(
        description="Basic food classification schema",
        categories=[
            FoodCategory(
                name="meal_type",
                description="When during the day this is typically eaten",
                labels=["breakfast", "lunch", "dinner", "snack", "dessert"],
            ),
            FoodCategory(
                name="cuisine",
                description="Culinary tradition or origin",
                labels=["american", "asian", "italian", "mexican", "mediterranean", "other"],
            ),
            FoodCategory(
                name="health",
                description="General healthiness of the dish",
                labels=["healthy", "moderate", "indulgent"],
            ),
        ],
    )

    async def _test() -> None:
        path = Path(__file__).parent / "chicken.png"
        raw = path.read_bytes()

        img = Image.open(BytesIO(raw))
        if img.format not in {"JPEG", "PNG", "WEBP", "GIF"}:
            buf = BytesIO()
            img.convert("RGB").save(buf, format="JPEG", quality=95)
            image_bytes = buf.getvalue()
            mime = "image/jpeg"
        else:
            image_bytes = raw
            mime = f"image/{img.format.lower()}"

        openai_client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
        mllm = MLLMClient(
            system_prompt="",
            model="gpt-5.4-mini",
            client=openai_client,
        )
        labeler = Labeler(mllm)
        result = await labeler.label(schema, image_bytes, mime=mime)
        for entry in result.labels:
            print(f"{entry.category:15} {entry.label}")

    asyncio.run(_test())
