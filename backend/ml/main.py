import base64

from ml.cv.endpoint import classify_and_iconify
from ml.pokefood_generator import pokefood_generator
from models.pokefood import Pokefood


async def generate_pokefood_and_icon(food_name: str, name: str, base64_image: str) -> Pokefood:
    bytesImage = base64.b64decode(base64_image)
    # Image detection and classification
    label_result, icon_bytes = await classify_and_iconify(bytesImage)

    # Convert FoodLabelResult to list of dicts for the generator
    labels_list = [
        {"category": entry.category, "label": entry.label}
        for entry in label_result.labels
    ]

    # Generate pokefood with labels from classification
    pokefood = pokefood_generator(labels=labels_list, food_name=food_name, name=name, image_base64=icon_bytes)

    return pokefood
