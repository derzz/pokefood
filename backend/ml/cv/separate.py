import asyncio
import logging

from rembg import remove

logger = logging.getLogger(__name__)


async def remove_background(image_bytes: bytes) -> bytes:
    return await asyncio.to_thread(remove, image_bytes)


if __name__ == "__main__":
    from pathlib import Path

    logging.basicConfig(level=logging.INFO)

    async def _test() -> None:
        path = Path(__file__).parent / "chicken.png"
        image_bytes = path.read_bytes()
        result = await remove_background(image_bytes)
        out = path.with_name("chicken_nobg.png")
        out.write_bytes(result)
        print(f"Input:  {len(image_bytes)} bytes")
        print(f"Output: {len(result)} bytes")
        print(f"Saved to {out}")

    asyncio.run(_test())
