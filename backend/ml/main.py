import base64

from ml.cv.endpoint import classify_and_iconify
from ml.pokefood_generator import pokefood_generator
from models.pokefood import Pokefood


async def generate_pokefood_and_icon(base64_image: str) -> Pokefood:
    bytesImage = base64.b64decode(base64_image)
    # Image detection and classification
    label_result, icon_bytes = await classify_and_iconify(bytesImage)

    pokefood = pokefood_generator(
        labels=label_result.labels,
        food_name=label_result.name,
        name=label_result.name,
        image_base64=icon_bytes,
        food_type=label_result.type,
        rarity=label_result.rarity.value,
    )

    return pokefood
