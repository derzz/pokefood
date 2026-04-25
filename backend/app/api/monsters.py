import os

from fastapi import APIRouter, Depends

from models.image_input import PokefoodFromImageRequest, PokefoodFromImageResponse
from app.services.cv_service import CVService

router = APIRouter(prefix="/api/v1/monsters", tags=["monsters"])


_cv_service = CVService(cv_service_url=os.getenv("CV_SERVICE_URL"))


def get_cv_service() -> CVService:
    return _cv_service


@router.post("/from-image", response_model=PokefoodFromImageResponse)
async def create_monster_from_image(
    request: PokefoodFromImageRequest,
    cv_service: CVService = Depends(get_cv_service),
) -> PokefoodFromImageResponse:
    pokefood, confidence = await cv_service.get_pokefood(bucket=request.bucket, object_path=request.object_path)
    return PokefoodFromImageResponse(pokefood=pokefood, source_confidence=confidence)
