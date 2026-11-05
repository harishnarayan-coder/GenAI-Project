import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

is_serverless = os.getenv("VERCEL") == "1" or os.getenv("AWS_LAMBDA_FUNCTION_NAME") is not None


backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
root_dir = os.path.dirname(backend_dir)
backend_env = os.path.join(backend_dir, ".env")
root_env = os.path.join(root_dir, ".env")

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:////tmp/meetmind.db" if is_serverless else "sqlite:///./meetmind.db"
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    GEMINI_API_KEY: Optional[str] = None
    CHROMA_PERSIST_DIR: str = "/tmp/chroma_db" if is_serverless else "./chroma_db"
    UPLOAD_DIR: str = "/tmp/uploads" if is_serverless else "./uploads"
    MAX_UPLOAD_SIZE: int = 10485760
    SUPABASE_URL: str = "https://qgrdzssdrhxyidhvecmo.supabase.co"
    SUPABASE_ANON_KEY: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFncmR6c3Nkcmh4eWlkaHZlY21vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3OTc5OTQsImV4cCI6MjEwOTM3Mzk5NH0.v83Yc0y7m1iazUKoVKSPn3YSaEKpIt9P5-RFE87DyDw"
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file=[root_env, backend_env, ".env"],
        extra="ignore",
    )


settings = Settings()
