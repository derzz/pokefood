import os
from collections.abc import Generator

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import Session, sessionmaker

from app.db.models import Base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./pokefood.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    # Auto-refresh the legacy table if it does not contain the new base64 image column.
    if DATABASE_URL.startswith("sqlite"):
        inspector = inspect(engine)
        if inspector.has_table("stored_pokefoods"):
            column_names = {column["name"] for column in inspector.get_columns("stored_pokefoods")}
            if "image_base64" not in column_names:
                with engine.begin() as connection:
                    connection.execute(text("DROP TABLE stored_pokefoods"))
    Base.metadata.create_all(bind=engine)
