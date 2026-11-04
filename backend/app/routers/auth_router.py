from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_current_user
from app.supabase_client import supabase

router = APIRouter()


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user_in: dict):
    """Register a new user via Supabase Auth."""
    try:
        email = user_in.get("email")
        password = user_in.get("password")
        username = user_in.get("username", "")
        full_name = user_in.get("full_name", "")

        if not email or not password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email and password are required",
            )

        # Sign up via Supabase Auth (this triggers the DB trigger to create profile)
        response = supabase.auth.sign_up({
            "email": email,
            "password": password,
            "options": {
                "data": {
                    "username": username,
                    "full_name": full_name,
                }
            }
        })

        if not response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration failed",
            )

        return {
            "access_token": response.session.access_token if response.session else "",
            "token_type": "bearer",
            "user": {
                "id": str(response.user.id),
                "email": response.user.email,
                "username": username,
                "full_name": full_name,
                "is_active": True,
                "created_at": str(response.user.created_at) if response.user.created_at else "",
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/login")
def login(credentials: dict):
    """Authenticate a user via Supabase Auth."""
    try:
        email = credentials.get("email")
        password = credentials.get("password")

        if not email or not password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email and password are required",
            )

        response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password,
        })

        if not response.user or not response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        # Fetch profile
        profile = supabase.table("profiles").select("*").eq("id", str(response.user.id)).single().execute()
        profile_data = profile.data or {}

        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "token_type": "bearer",
            "user": {
                "id": str(response.user.id),
                "email": response.user.email,
                "username": profile_data.get("username", ""),
                "full_name": profile_data.get("full_name", ""),
                "is_active": profile_data.get("is_active", True),
                "created_at": profile_data.get("created_at", ""),
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )


@router.post("/refresh")
def refresh_token(body: dict):
    """Refresh an expired access token."""
    try:
        refresh_token = body.get("refresh_token")
        if not refresh_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Refresh token is required",
            )

        response = supabase.auth.refresh_session(refresh_token)

        if not response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "token_type": "bearer",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )


@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return current_user


@router.post("/logout")
def logout():
    """Sign out the user (client-side token invalidation)."""
    return {"message": "Logged out successfully"}


@router.post("/forgot-password")
def forgot_password(body: dict):
    """Send a password reset email via Supabase."""
    try:
        email = body.get("email")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is required",
            )

        supabase.auth.reset_password_email(email)
        return {"message": "Password reset email sent"}
    except Exception as e:
        # Don't reveal if email exists
        return {"message": "If an account exists for that email, a reset link has been sent."}
