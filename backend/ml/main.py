import base64

from fastapi import FastAPI, Form

from ml.cv.endpoint import classify_and_iconify
from ml.pokefood_generator import pokefood_generator
from models.pokefood import Pokefood

app = FastAPI(title="FastAPI Starter", version="0.1.0")

@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/generate-pokefood", response_model=Pokefood)
async def pokefood_generation_endpoint(food_name: str = Form(...), name: str = Form(...), base64Image: str = Form(...)) -> Pokefood:
    bytesImage = base64.b64decode(base64Image)
    # Image detection and classification
    label_result, icon_bytes = await classify_and_iconify(bytesImage)

    # Convert FoodLabelResult to list of dicts for the generator
    labels_list = [
        {"category": entry.category, "label": entry.label}
        for entry in label_result.labels
    ]

    # Generate pokefood with labels from classification
    pokefood = pokefood_generator(
        labels=labels_list,
        food_name=food_name,
        name=name,
        image_url=None,  # Will use default placeholder or add actual URL handling if needed
    )

    return pokefood
