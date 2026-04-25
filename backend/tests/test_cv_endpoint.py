import asyncio
from pathlib import Path

from dotenv import load_dotenv

from ml.cv.endpoint import classify_and_iconify
from ml.cv.model import DEFAULT_FOOD_LABEL_SCHEMA, FoodLabelResult

load_dotenv()


def test_classify_and_iconify_end_to_end() -> None:
    image_path = Path(__file__).parent.parent / "ml/cv/chicken.png"
    raw = image_path.read_bytes()

    result, icon = asyncio.run(classify_and_iconify(raw))

    assert isinstance(result, FoodLabelResult)
    expected_categories = {c.name for c in DEFAULT_FOOD_LABEL_SCHEMA.categories}
    returned = {entry.category for entry in result.labels}
    assert expected_categories.issubset(returned)

    print()
    for entry in result.labels:
        print(f"{entry.category:20} {entry.label}")

    assert isinstance(icon, bytes) and len(icon) > 0
    assert icon[:8] == b"\x89PNG\r\n\x1a\n"

    out = Path(__file__).parent / "chicken_icon.png"
    out.write_bytes(icon)
    print(f"Saved icon to {out} ({len(icon)} bytes)")
