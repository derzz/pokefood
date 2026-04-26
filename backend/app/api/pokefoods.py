import json
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.models import StoredPokefood, User
from app.db.session import get_db
from app.services.cv_service import CVService
from models.constants import FoodType
from models.image_input import MiguCreateRequest, PokefoodFromImageRequest, PokefoodFromImageResponse
from models.pokefood import Move, Pokefood
from models.stored_pokefood import StoredPokefoodResponse

router = APIRouter(prefix="/api/v1/pokefoods", tags=["pokefoods"])
logger = logging.getLogger(__name__)

_cv_service = CVService()

def get_cv_service() -> CVService:
    return _cv_service


def _to_response(record: StoredPokefood) -> StoredPokefoodResponse:
    pokefood = Pokefood(
        personal_name=record.personal_name,
        name=record.name,
        image_base64=record.image_base64,
        labels=json.loads(record.labels_json),
        hp=record.hp,
        type=record.type,
        moves=[Move.model_validate(move) for move in json.loads(record.moves_json)],
        rarity=record.rarity,
    )
    return StoredPokefoodResponse(
        id=record.id,
        created_at=record.created_at,
        pokefood=pokefood,
    )


def _build_migu_pokefood(image_base64: str) -> Pokefood:
    return Pokefood(
        personal_name="migu",
        name="migu",
        image_base64=image_base64,
        labels=["migu", "legendary", "console"],
        hp=1000,
        type=FoodType.MEAT,
        moves=[Move(name="megu", damage=1000)],
        rarity="legendary",
    )


@router.post("/from-image", response_model=PokefoodFromImageResponse)
async def create_pokefood_from_image(
    request: PokefoodFromImageRequest,
    cv_service: CVService = Depends(get_cv_service),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PokefoodFromImageResponse:
    logger.info(
        "pokefoods.from_image called",
        extra={"user_id": current_user.id},
    )
    try:
        pokefood = await cv_service.get_pokefood(image_base64=request.image_base64)
    except Exception:
        logger.exception("create_pokefood_from_image: cv_service.get_pokefood failed")
        raise

    record = StoredPokefood(
        user_id=current_user.id,
        personal_name=pokefood.personal_name,
        name=pokefood.name,
        image_base64=pokefood.image_base64,
        labels_json=json.dumps(pokefood.labels),
        hp=pokefood.hp,
        type=pokefood.type,
        moves_json=json.dumps([move.model_dump(mode="json") for move in pokefood.moves]),
        rarity=pokefood.rarity,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return PokefoodFromImageResponse(
        pokefood=pokefood,
        stored_pokefood_id=record.id,
        source_confidence=1.0,
    )


@router.post("/migu", response_model=StoredPokefoodResponse)
async def create_migu_pokefood(
    request: MiguCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StoredPokefoodResponse:
    logger.info("pokefoods.migu called", extra={"user_id": current_user.id})
    pokefood = _build_migu_pokefood(image_base64=request.image_base64)

    record = StoredPokefood(
        user_id=current_user.id,
        personal_name=pokefood.personal_name,
        name=pokefood.name,
        image_base64=pokefood.image_base64,
        labels_json=json.dumps(pokefood.labels),
        hp=pokefood.hp,
        type=pokefood.type,
        moves_json=json.dumps([move.model_dump(mode="json") for move in pokefood.moves]),
        rarity=pokefood.rarity,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return _to_response(record)


@router.get("", response_model=list[StoredPokefoodResponse])
async def list_my_pokefoods(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[StoredPokefoodResponse]:
    logger.info("pokefoods.list called", extra={"user_id": current_user.id})
    rows = db.scalars(
        select(StoredPokefood)
        .where(StoredPokefood.user_id == current_user.id)
        .order_by(StoredPokefood.created_at.desc())
    ).all()
    return [_to_response(row) for row in rows]


@router.get("/all", response_model=list[StoredPokefoodResponse])
async def get_all_my_pokefoods(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[StoredPokefoodResponse]:
    # Alias kept for clients that expect a named getAll-style endpoint.
    logger.info("pokefoods.all called user_id: %s", current_user.id)
    return await list_my_pokefoods(current_user=current_user, db=db)


@router.get("/{pokefood_id}", response_model=StoredPokefoodResponse)
async def get_my_pokefood(
    pokefood_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StoredPokefoodResponse:
    logger.info(
        "pokefoods.get_one called",
        extra={"user_id": current_user.id, "pokefood_id": pokefood_id},
    )
    row = db.get(StoredPokefood, pokefood_id)
    if row is None or row.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pokefood not found")
    return _to_response(row)


@router.delete("/{pokefood_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_pokefood(
    pokefood_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    logger.info(
        "pokefoods.delete called",
        extra={"user_id": current_user.id, "pokefood_id": pokefood_id},
    )
    row = db.get(StoredPokefood, pokefood_id)
    if row is None or row.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pokefood not found")
    db.delete(row)
    db.commit()
