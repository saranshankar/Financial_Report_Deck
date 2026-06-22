from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

# Determine connection URL: fallback to sqlite memory during test/import if not set
db_url = settings.DATABASE_URL
if not db_url or db_url.strip() == "":
    db_url = "sqlite:///:memory:"

# Create engine with database-specific configurations
engine_kwargs = {}
if db_url.startswith("postgresql"):
    engine_kwargs = {
        "pool_pre_ping": True,
        "pool_size": 10,
        "max_overflow": 20
    }

engine = create_engine(db_url, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
