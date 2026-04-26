from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    pokefoods: Mapped[list[StoredPokefood]] = relationship(back_populates="owner", cascade="all, delete-orphan")


class StoredPokefood(Base):
    __tablename__ = "stored_pokefoods"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    personal_name: Mapped[str] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(255))
    image_base64: Mapped[str] = mapped_column(Text)
    labels_json: Mapped[str] = mapped_column(Text)
    hp: Mapped[int] = mapped_column(Integer)
    atk: Mapped[int] = mapped_column(Integer)
    type: Mapped[str] = mapped_column(String(32))
    moves_json: Mapped[str] = mapped_column(Text)
    rarity: Mapped[str] = mapped_column(String(32), default="common")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    owner: Mapped[User] = relationship(back_populates="pokefoods")
