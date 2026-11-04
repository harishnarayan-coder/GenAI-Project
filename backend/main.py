import os
import sys
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure the ``app`` package inside the ``backend`` directory can be imported
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.database import engine, Base
from app.routers import auth_router, meetings_router, ai_router, tasks_router, knowledge_router, analytics_router
from app.config import settings

logging.basicConfig(level=logging.INFO)

# Create all database tables
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    logging.warning(f"Could not initialize database tables: {e}")

# Ensure required directories exist (use /tmp on serverless environments)
try:
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
except Exception as e:
    logging.warning(f"Could not create storage directories: {e}")

app = FastAPI(
    title="MeetMind AI API",
    description="Meeting Notes to Action Items Converter – Powered by Generative AI & RAG",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(meetings_router.router, prefix="/api/meetings", tags=["Meetings"])
app.include_router(ai_router.router, prefix="/api/ai", tags=["AI Analysis"])
app.include_router(tasks_router.router, prefix="/api/tasks", tags=["Tasks"])
app.include_router(knowledge_router.router, prefix="/api/knowledge", tags=["Knowledge Base"])
app.include_router(analytics_router.router, prefix="/api/analytics", tags=["Analytics"])


@app.get("/", tags=["Health"])
def root():
    return {"message": "MeetMind AI API is running", "version": "1.0.0", "docs": "/docs"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}


@app.get("/api", tags=["Health"])
def api_root():
    return {"message": "MeetMind AI API is running", "version": "1.0.0"}


@app.get("/api/health", tags=["Health"])
def api_health():
    return {"status": "healthy"}
