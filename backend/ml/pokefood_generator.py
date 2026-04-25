from __future__ import annotations

import hashlib
import json
import logging
import random
import re
from collections.abc import Mapping, Sequence
from pathlib import Path
from typing import Any, Literal

from pydantic import ValidationError

from models.pokefood import Move, Pokefood

logger = logging.getLogger(__name__)

PokefoodType = Literal["fruveg", "meat", "grain"]
_MOVES_JSON_PATH = Path(__file__).with_name("moves.json")


def _normalize_key(text: str) -> str:
    cleaned = text.strip().lower().replace("&", " and ")
    cleaned = re.sub(r"\([^)]*\)", " ", cleaned)
    cleaned = re.sub(r"[^a-z0-9]+", "_", cleaned)
    cleaned = re.sub(r"_+", "_", cleaned).strip("_")
    return cleaned


def _key_variants(text: str) -> list[str]:
    base = _normalize_key(text)
    if not base:
        return []
    parts = [p for p in base.split("_") if p not in {"and", "or", "the", "a", "an"}]
    variants = [base]
    if parts:
        variants.append("_".join(parts))
        variants.append(parts[0])
    return list(dict.fromkeys(v for v in variants if v))


def _best_key_match(raw: str, options: Sequence[str]) -> str | None:
    if not raw or not options:
        return None

    for variant in _key_variants(raw):
        if variant in options:
            return variant

    raw_tokens = set(_normalize_key(raw).split("_"))
    best: tuple[int, str] | None = None
    for option in options:
        option_tokens = set(option.split("_"))
        score = len(raw_tokens & option_tokens)
        if score <= 0:
            continue
        if best is None or score > best[0]:
            best = (score, option)
    return best[1] if best else None


def _split_category_label(label: str) -> tuple[str | None, str]:
    if ":" not in label:
        return None, label.strip()
    category, value = label.split(":", 1)
    return category.strip() or None, value.strip()


def _load_moves_catalog() -> dict[str, dict[str, list[dict[str, Any]]]]:
    try:
        raw = json.loads(_MOVES_JSON_PATH.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return {}

    catalog: dict[str, dict[str, list[dict[str, Any]]]] = {}
    if not isinstance(raw, dict):
        return catalog

    for category, label_map in raw.items():
        if not isinstance(category, str) or not isinstance(label_map, dict):
            continue
        normalized_category = _normalize_key(category)
        catalog.setdefault(normalized_category, {})
        for label_key, moves in label_map.items():
            if isinstance(label_key, str) and isinstance(moves, list):
                catalog[normalized_category][_normalize_key(label_key)] = moves
    return catalog


def _find_move_pool(catalog: Mapping[str, Mapping[str, list[dict[str, Any]]]], label: str) -> list[dict[str, Any]]:
    category_raw, value_raw = _split_category_label(label)
    category_keys = list(catalog.keys())

    if category_raw:
        category_match = _best_key_match(category_raw, category_keys)
        if category_match:
            value_keys = list(catalog[category_match].keys())
            value_match = _best_key_match(value_raw, value_keys)
            if value_match:
                return list(catalog[category_match][value_match])

    # Fallback: try value-only matching across all categories.
    best_pool: list[dict[str, Any]] = []
    best_score = 0
    value_tokens = set(_normalize_key(value_raw).split("_"))
    for label_map in catalog.values():
        for label_key, pool in label_map.items():
            score = len(value_tokens & set(label_key.split("_")))
            if score > best_score:
                best_score = score
                best_pool = list(pool)
    return best_pool

def _normalize_labels(labels: Sequence[Any]) -> list[str]:
    normalized: list[str] = []
    for label in labels:
        if isinstance(label, str):
            text = label.strip()
        elif isinstance(label, Mapping):
            category = label.get("category")
            value = label.get("label") or label.get("name") or label.get("value")
            text = f"{category}: {value}" if category and value else str(value or label).strip()
        else:
            category = getattr(label, "category", None)
            value = getattr(label, "label", None) or getattr(label, "name", None) or getattr(label, "value", None)
            text = f"{category}: {value}" if category and value else str(value or label).strip()

        if text:
            normalized.append(text)

    return normalized


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "pokefood"


def _infer_type(*, labels: Sequence[str], food_name: str, name: str) -> PokefoodType:
    text = " ".join([food_name, name, *labels]).lower()
    if any(keyword in text for keyword in ("fruit", "veg", "vegetable", "salad", "berry", "leaf", "plant")):
        return "fruveg"
    if any(keyword in text for keyword in ("meat", "beef", "pork", "chicken", "fish", "salmon", "tuna", "steak", "bacon")):
        return "meat"
    return "grain"


def _derive_hp(*, labels: Sequence[str], food_name: str, name: str) -> int:
    seed = "|".join([food_name, name, *labels]).encode("utf-8")
    digest = hashlib.sha256(seed).hexdigest()
    return 60 + (int(digest[:8], 16) % 41)


def _build_moves(labels: Sequence[str]) -> list[Move]:
    if not labels:
        return [Move(name="Signature Bite", damage=12), Move(name="Quick Nibble", damage=8)]

    catalog = _load_moves_catalog()
    selected_labels = random.sample(list(labels), k=min(4, len(labels)))
    moves: list[Move] = []
    used_names: set[str] = set()

    for label in selected_labels:
        pool = _find_move_pool(catalog, label)
        if not pool:
            continue
        chosen = random.choice(pool)
        move_name = str(chosen.get("move_name", "Quick Nibble")).strip() or "Quick Nibble"
        if move_name in used_names:
            continue
        damage = int(chosen.get("base_dmg", 10))
        moves.append(Move(name=move_name, damage=max(1, damage)))
        used_names.add(move_name)
        if len(moves) >= 4:
            break

    if moves:
        return moves
    return [Move(name="Signature Bite", damage=12), Move(name="Quick Nibble", damage=8)]


def pokefood_generator(
    labels: Sequence[Any],
    food_name: str,
    name: str,
    image_base64: bytes,
) -> Pokefood:
    normalized_labels = _normalize_labels(labels)
    if not normalized_labels:
        normalized_labels = [food_name, name]

    pokefood_type = _infer_type(labels=normalized_labels, food_name=food_name, name=name)
    hp = _derive_hp(labels=normalized_labels, food_name=food_name, name=name)
    moves = _build_moves(normalized_labels)

    try:
        return Pokefood(
            personal_name=food_name,
            name=name,
            image_base64=image_base64,
            labels=normalized_labels,
            hp=hp,
            type=pokefood_type,
            moves=moves,
        )
    except ValidationError as exc:
        logger.error(
            "Pokefood construction failed: errors=%s | "
            "personal_name=%r name=%r image_base64_type=%s image_base64_len=%s "
            "labels=%r hp=%r type=%r moves=%r",
            exc.errors(),
            food_name,
            name,
            type(image_base64).__name__,
            (len(image_base64) if hasattr(image_base64, "__len__") else "n/a"),
            normalized_labels,
            hp,
            pokefood_type,
            [m.model_dump() for m in moves],
        )
        raise
