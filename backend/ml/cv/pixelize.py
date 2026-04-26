import base64
from io import BytesIO

from openai import AsyncOpenAI
from PIL import Image

_MODEL = "gpt-image-1"

_PROMPT = (
    "Transform this image into pixel art. Render it in a retro 8-bit style with chunky visible "
    "pixels, a limited color palette, and a nostalgic video game aesthetic. Preserve the same "
    "subject and overall composition."
)


class Pixelizer:
    def __init__(self, client: AsyncOpenAI) -> None:
        self._client = client

    async def pixelize(self, image_bytes: bytes) -> bytes:
        png_bytes = _to_rgba_png(image_bytes)
        response = await self._client.images.edit(
            model=_MODEL,
            image=("image.png", png_bytes, "image/png"),
            prompt=_PROMPT,
        )
        b64 = response.data[0].b64_json
        assert b64 is not None
        return base64.b64decode(b64)


def _to_rgba_png(image_bytes: bytes) -> bytes:
    img = Image.open(BytesIO(image_bytes)).convert("RGBA")
    buf = BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


if __name__ == "__main__":
    import asyncio
    import os
    from pathlib import Path

    from dotenv import load_dotenv

    load_dotenv()

    async def _smoke_test() -> None:
        path = Path(__file__).parents[2] / "chicken.png"
        image_bytes = path.read_bytes()
        client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
        pixelizer = Pixelizer(client)
        result = await pixelizer.pixelize(image_bytes)
        out = path.with_name("chicken_pixelized.png")
        out.write_bytes(result)
        print(f"Input:  {len(image_bytes)} bytes")
        print(f"Output: {len(result)} bytes")
        print(f"Saved to {out}")

    asyncio.run(_smoke_test())
