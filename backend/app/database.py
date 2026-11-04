import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

logger = logging.getLogger(__name__)

is_serverless = os.getenv("VERCEL") == "1" or os.getenv("AWS_LAMBDA_FUNCTION_NAME") is not None
db_url = settings.DATABASE_URL

if is_serverless and ("sqlite" in db_url) and not ("/tmp" in db_url):
    db_url = "sqlite:////tmp/meetmind.db"

# Check if SQLite or PostgreSQL
if db_url.startswith("sqlite"):
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False},
    )
else:
    # Try connecting to PostgreSQL, fallback to SQLite if unreachable
    try:
        test_engine = create_engine(
            db_url,
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=10,
        )
        with test_engine.connect() as conn:
            pass
        engine = test_engine
        logger.info(f"Connected to database at {db_url}")
    except Exception as e:
        fallback_sqlite = "sqlite:////tmp/meetmind.db" if is_serverless else "sqlite:///./meetmind.db"
        logger.warning(f"Could not connect to PostgreSQL ({e}). Falling back to SQLite ({fallback_sqlite}).")
        engine = create_engine(
            fallback_sqlite,
            connect_args={"check_same_thread": False},
        )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency that provides a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
