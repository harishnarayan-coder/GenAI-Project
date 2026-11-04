from supabase import create_client, Client
from app.config import settings

url = settings.SUPABASE_URL or "https://qgrdzssdrhxyidhvecmo.supabase.co"
key = settings.SUPABASE_ANON_KEY or "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFncmR6c3Nkcmh4eWlkaHZlY21vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3OTc5OTQsImV4cCI6MjEwOTM3Mzk5NH0.v83Yc0y7m1iazUKoVKSPn3YSaEKpIt9P5-RFE87DyDw"

try:
    supabase: Client = create_client(url, key)
except Exception:
    supabase = None


def get_supabase() -> Client:
    """Return the Supabase client instance."""
    return supabase
