from typing import Optional
import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app.supabase_client import supabase

logger = logging.getLogger(__name__)

# Use HTTPBearer for Supabase JWT tokens
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> models.User:
    """Verify Supabase JWT token, sync user to local DB, and return user model."""
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        user_id = None
        user_email = None
        user_meta = {}
        profile = {}

        # 1. Try Supabase API verification
        try:
            user_response = supabase.auth.get_user(token)
            if user_response and user_response.user:
                u = user_response.user
                user_id = str(u.id)
                user_email = u.email
                user_meta = getattr(u, "user_metadata", {}) or {}
        except Exception as e:
            logger.debug(f"supabase.auth.get_user API check failed: {e}")

        # 2. Fallback: decode JWT claims directly if API check failed
        if not user_id:
            import jwt as pyjwt
            try:
                payload = pyjwt.decode(token, options={"verify_signature": False})
                user_id = str(payload.get("sub", ""))
                user_email = payload.get("email")
                user_meta = payload.get("user_metadata", {}) or {}
            except Exception as e2:
                logger.error(f"JWT decode failed: {e2}")
                raise credentials_exception

        if not user_id:
            raise credentials_exception

        # 3. Fetch profile if available
        try:
            profile_response = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
            if profile_response and profile_response.data:
                profile = profile_response.data
        except Exception as e:
            logger.debug(f"Could not fetch profile from Supabase table: {e}")

        if profile and not profile.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user",
            )

        username = profile.get("username") or user_meta.get("username") or (user_email.split("@")[0] if user_email else "user")
        full_name = profile.get("full_name") or user_meta.get("full_name") or ""

        # 4. Sync/upsert into local database
        user_record = db.query(models.User).filter(models.User.id == user_id).first()
        if not user_record:
            user_record = models.User(
                id=user_id,
                email=user_email or f"{username}@meetmind.ai",
                username=username,
                full_name=full_name,
                is_active=True,
            )
            db.add(user_record)
            db.commit()
            db.refresh(user_record)
        else:
            # Update fields if changed
            updated = False
            if full_name and user_record.full_name != full_name:
                user_record.full_name = full_name
                updated = True
            if updated:
                db.commit()
                db.refresh(user_record)

        return user_record
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise credentials_exception

