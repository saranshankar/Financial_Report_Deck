import logging
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from .config import settings
from .database import engine, Base, get_db
from .api import auth, transactions, cashback, offers, insights, reconciliation, accounts, budgets, savings, subscriptions, timeline, search, reports

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Validate DATABASE_URL configuration
    if not settings.DATABASE_URL or "sqlite" in settings.DATABASE_URL:
        print("\n" + "="*80)
        print(" CRITICAL DATABASE CONFIGURATION ERROR")
        print("="*80)
        print(" DATABASE_URL environment variable is missing or empty.")
        print("\n To resolve this:")
        print(" 1. Create a '.env' file in the 'backend/' directory (copied from '.env.example').")
        print(" 2. Define DATABASE_URL in that '.env' file or your environment:")
        print("    - Local Development: DATABASE_URL=postgresql://postgres:postgres@localhost:5432/finsight")
        print("    - Docker Setup:      DATABASE_URL=postgresql://postgres:postgres@db:5432/finsight")
        print("="*80 + "\n")
        sys.exit(1)

    # Initialize Database tables
    try:
        logger.info("Initializing database tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully.")
        
        # Seed demo user if missing in the database
        from .database import SessionLocal
        from .models import User
        from .security import get_password_hash
        import uuid
        
        db = SessionLocal()
        try:
            demo_user = db.query(User).filter(User.email == "demo@finsight.ai").first()
            if not demo_user:
                logger.info("Demo user 'demo@finsight.ai' not found. Seeding demo user...")
                hashed_pw = get_password_hash("password123")
                db_user = User(
                    id=uuid.UUID("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"),
                    email="demo@finsight.ai",
                    hashed_password=hashed_pw,
                    full_name="Demo FinSight User"
                )
                db.add(db_user)
                db.commit()
                logger.info("Demo user seeded successfully.")
        except Exception as e:
            logger.error(f"Failed to seed demo user: {e}")
            db.rollback()
        finally:
            db.close()
            
    except Exception as e:
        logger.critical(f"Database connection and table initialization failed: {e}")
        sys.exit(1)
    yield

app = FastAPI(
    title="FinSight AI API",
    description="Unified Financial Intelligence Platform API backend powered by Gemini AI",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration for Frontend access
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api")
app.include_router(transactions.router, prefix="/api")
app.include_router(cashback.router, prefix="/api")
app.include_router(offers.router, prefix="/api")
app.include_router(insights.router, prefix="/api")
app.include_router(reconciliation.router, prefix="/api")
app.include_router(accounts.router, prefix="/api")
app.include_router(budgets.router, prefix="/api")
app.include_router(savings.router, prefix="/api")
app.include_router(subscriptions.router, prefix="/api")
app.include_router(timeline.router, prefix="/api")
app.include_router(search.router, prefix="/api")
app.include_router(reports.router, prefix="/api")

from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request, exc: StarletteHTTPException):
    logger.error(f"HTTP error occurred: {exc.detail} (Status: {exc.status_code})")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail,
            "detail": exc.detail
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    logger.error(f"Validation error occurred: {exc.errors()}")
    return JSONResponse(
        status_code=400,
        content={
            "success": False,
            "error": "Validation failed",
            "detail": exc.errors()
        }
    )

@app.exception_handler(Exception)
async def catch_all_exception_handler(request, exc: Exception):
    logger.error(f"Unhandled system error occurred: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal Server Error",
            "detail": str(exc)
        }
    )

@app.get("/")
def read_root():
    return {
        "message": "Welcome to FinSight AI API",
        "status": "online",
        "version": "1.0.0"
    }

@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    from datetime import datetime
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.utcnow().isoformat(),
            "api": "online",
            "service": "FinSight AI",
            "version": "1.0.0"
        }
    except Exception as e:
        logger.error(f"Health check database error: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "status": "unhealthy",
                "database": "disconnected",
                "timestamp": datetime.utcnow().isoformat(),
                "api": "online",
                "reason": str(e),
                "service": "FinSight AI",
                "version": "1.0.0"
            }
        )
