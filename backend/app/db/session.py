import os
import logging
from collections.abc import Generator

from sqlalchemy import create_engine, inspect, select, text
from sqlalchemy.orm import Session, sessionmaker

from app.db.models import Base, User

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./pokefood.db")
SEED_DUMMY_TEST_ACCOUNTS = os.getenv("SEED_DUMMY_TEST_ACCOUNTS", "true").lower() == "true"
DUMMY_ACCOUNT_1_EMAIL = os.getenv("DUMMY_ACCOUNT_1_EMAIL", "test1@example.com").strip().lower()
DUMMY_ACCOUNT_1_PASSWORD = os.getenv("DUMMY_ACCOUNT_1_PASSWORD", "secret123")
DUMMY_ACCOUNT_2_EMAIL = os.getenv("DUMMY_ACCOUNT_2_EMAIL", "test2@example.com").strip().lower()
DUMMY_ACCOUNT_2_PASSWORD = os.getenv("DUMMY_ACCOUNT_2_PASSWORD", "secret123")

logger = logging.getLogger(__name__)

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
            elif "rarity" not in column_names:
                with engine.begin() as connection:
                    connection.execute(text("ALTER TABLE stored_pokefoods ADD COLUMN rarity VARCHAR(32) DEFAULT 'common'"))
    Base.metadata.create_all(bind=engine)
    _seed_dummy_accounts()


def _seed_dummy_accounts() -> None:
    if not SEED_DUMMY_TEST_ACCOUNTS:
        return

    # Import lazily to avoid a circular import path between session and security modules.
    from app.core.security import hash_password

    configured_accounts = [
        (DUMMY_ACCOUNT_1_EMAIL, DUMMY_ACCOUNT_1_PASSWORD),
        (DUMMY_ACCOUNT_2_EMAIL, DUMMY_ACCOUNT_2_PASSWORD),
    ]
    accounts = [(email, password) for email, password in configured_accounts if email and password]
    if not accounts:
        return

    with SessionLocal() as db:
        emails = [email for email, _ in accounts]
        existing_emails = {
            email
            for email, in db.execute(
                select(User.email).where(User.email.in_(emails))
            )
        }

        created_emails: list[str] = []
        for email, password in accounts:
            if email in existing_emails:
                continue
            db.add(User(email=email, password_hash=hash_password(password)))
            created_emails.append(email)

        if created_emails:
            db.commit()
            logger.info("db seeded dummy test accounts", extra={"count": len(created_emails)})
