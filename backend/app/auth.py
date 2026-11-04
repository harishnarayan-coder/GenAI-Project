from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client

from app.config import settings
from app.supabase_client import supabase

# Use HTTPBearer for Supabase JWT tokens
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Verify Supabase JWT token and return user data."""
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Use Supabase to verify the token and get user
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise credentials_exception
        
        user = user_response.user
        
        # Fetch profile from profiles table
        profile_response = supabase.table("profiles").select("*").eq("id", str(user.id)).single().execute()
        
        if not profile_response.data:
            raise credentials_exception
        
        profile = profile_response.data
        if not profile.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user",
            )
        
        return {
            "id": str(user.id),
            "email": user.email,
            "username": profile.get("username", ""),
            "full_name": profile.get("full_name", ""),
            "is_active": profile.get("is_active", True),
            "created_at": profile.get("created_at", ""),
        }
    except HTTPException:
        raise
    except Exception:
        raise credentials_exception
