import os
import sys
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure the ``app`` package inside the ``backend`` directory can be imported
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.database import engine, Base
from app.routers import auth_router, meetings_router, ai_router, tasks_router, knowledge_router, analytics_router

logging.basicConfig(level=logging.INFO)

# Create all database tables
Base.metadata.create_all(bind=engine)

# Ensure required directories exist
os.makedirs("uploads", exist_ok=True)
os.makedirs("chroma_db", exist_ok=True)

app = FastAPI(
    title="MeetMind AI API",
    description="Meeting Notes to Action Items Converter – Powered by Generative AI & RAG",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
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
