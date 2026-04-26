"""
One-time script to download color emoji sprites from Twemoji (CC BY 4.0).
Run from the backend/ directory: uv run python assets/download_sprites.py
"""

from pathlib import Path

import httpx

from models.constants import FoodType

BASE = "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72"

# Codepoints map to 72x72 color PNG emoji
ICONS: dict[str, dict[str, str]] = {
    "categories": {
        "regional_heritage": f"{BASE}/1f30d.png",   # 🌍 globe
        "preparation_method": f"{BASE}/1f525.png",  # 🔥 fire
        "health": f"{BASE}/1f33f.png",              # 🌿 herb
        "meal_course": f"{BASE}/1f374.png",             # 🍴 fork and knife
        "temperature": f"{BASE}/1f321.png",          # 🌡 thermometer
        "texture": f"{BASE}/1f4a7.png",             # 💧 droplet
        "prep_time": f"{BASE}/23f3.png",            # ⏳ hourglass
    },
    "types": {
        FoodType.MEAT: f"{BASE}/1f969.png",                # 🥩 cut of meat
        FoodType.GRAINS: f"{BASE}/1f33e.png",              # 🌾 sheaf of rice
        FoodType.FRUITS_VEGETABLES: f"{BASE}/1f966.png",   # 🥦 broccoli
    },
}


def download_sprites() -> None:
    assets_dir = Path(__file__).parent
    with httpx.Client(timeout=15) as client:
        for folder, items in ICONS.items():
            out_dir = assets_dir / folder
            out_dir.mkdir(exist_ok=True)
            for name, url in items.items():
                resp = client.get(url)
                resp.raise_for_status()
                out_path = out_dir / f"{name}.png"
                out_path.write_bytes(resp.content)
                print(f"  {folder}/{name}.png")
    print("Done.")


if __name__ == "__main__":
    download_sprites()
