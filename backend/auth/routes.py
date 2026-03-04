"""
Authentication API Endpoints

User registration, login, token refresh, profile management
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from typing import List

from auth.authentication import (
    User, UserCreate, UserLogin, Token,
    UserManager, create_tokens_for_user,
    get_current_user, get_current_active_user,
    RequireRole, UserRole, TokenData,
    hash_password, verify_password, decode_token,
    create_access_token
)

# Create router
router = APIRouter(prefix="/auth", tags=["Authentication"])


# ============================================================
# Registration & Login
# ============================================================

@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """
    Register a new user
    
    - **email**: Valid email address
    - **username**: Unique username
    - **password**: Strong password (min 8 chars)
    - **role**: User role (default: viewer)
    """
    # Validate password strength
    if len(user_data.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long"
        )
    
    # Create user
    user = await UserManager.create_user(user_data)
    
    return user


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    """
    Login with email and password
    
    Returns JWT access and refresh tokens
    """
    # Authenticate user
    user = await UserManager.authenticate_user(
        credentials.email,
        credentials.password
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last login
    await UserManager.update_last_login(user.id)
    
    # Create tokens
    tokens = create_tokens_for_user(user)
    
    return tokens


@router.post("/token", response_model=Token)
async def login_oauth(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    OAuth2 compatible token endpoint
    
    For compatibility with OAuth2 clients
    """
    user = await UserManager.authenticate_user(
        form_data.username,  # email in our case
        form_data.password
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    tokens = create_tokens_for_user(user)
    return tokens


@router.post("/refresh", response_model=Token)
async def refresh_token(refresh_token: str):
    """
    Refresh access token using refresh token
    """
    try:
        token_data = decode_token(refresh_token)
    except HTTPException:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Create new access token
    new_token_data = {
        "sub": token_data.user_id,
        "email": token_data.email,
        "role": token_data.role.value
    }
    
    access_token = create_access_token(new_token_data)
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,  # Keep same refresh token
        expires_in=1800
    )


# ============================================================
# User Profile
# ============================================================

@router.get("/me", response_model=TokenData)
async def get_profile(current_user: TokenData = Depends(get_current_active_user)):
    """
    Get current user profile
    
    Requires authentication
    """
    return current_user


@router.put("/me", response_model=User)
async def update_profile(
    full_name: str = None,
    current_user: TokenData = Depends(get_current_active_user)
):
    """
    Update current user profile
    """
    # In production: Update database
    # user = await db.users.update_one(...)
    
    # Placeholder response
    return User(
        id=current_user.user_id,
        email=current_user.email,
        username="placeholder",
        full_name=full_name,
        role=current_user.role,
        created_at=datetime.utcnow()
    )


@router.post("/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    current_password: str,
    new_password: str,
    current_user: TokenData = Depends(get_current_active_user)
):
    """
    Change user password
    
    Requires current password for verification
    """
    # Validate new password
    if len(new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters long"
        )
    
    # In production: Verify current password and update
    # user = await db.users.find_one({"id": current_user.user_id})
    # if not verify_password(current_password, user.hashed_password):
    #     raise HTTPException(status_code=400, detail="Incorrect password")
    
    # hashed_new = hash_password(new_password)
    # await db.users.update_one({...}, {"$set": {"hashed_password": hashed_new}})
    
    return {"message": "Password updated successfully"}


# ============================================================
# API Key Management
# ============================================================

@router.post("/api-key", response_model=dict)
async def generate_api_key(
    current_user: TokenData = Depends(get_current_active_user)
):
    """
    Generate a new API key for the user
    """
    api_key = UserManager.generate_api_key()
    
    # In production: Save to database
    # await db.users.update_one(
    #     {"id": current_user.user_id},
    #     {"$set": {"api_key": api_key}}
    # )
    
    return {
        "api_key": api_key,
        "message": "Store this key securely. It won't be shown again."
    }


@router.delete("/api-key", status_code=status.HTTP_200_OK)
async def revoke_api_key(
    current_user: TokenData = Depends(get_current_active_user)
):
    """
    Revoke current API key
    """
    # In production: Remove from database
    # await db.users.update_one(
    #     {"id": current_user.user_id},
    #     {"$unset": {"api_key": ""}}
    # )
    
    return {"message": "API key revoked successfully"}


# ============================================================
# Admin-Only Endpoints
# ============================================================

@router.get("/users", response_model=List[User])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    current_user: TokenData = Depends(RequireRole(UserRole.ADMIN))
):
    """
    List all users (Admin only)
    """
    # In production: Fetch from database
    # users = await db.users.find().skip(skip).limit(limit).to_list(limit)
    
    # Placeholder
    return []


@router.put("/users/{user_id}/role", response_model=User)
async def update_user_role(
    user_id: str,
    new_role: UserRole,
    current_user: TokenData = Depends(RequireRole(UserRole.ADMIN))
):
    """
    Update user role (Admin only)
    """
    # In production: Update database
    # await db.users.update_one(
    #     {"id": user_id},
    #     {"$set": {"role": new_role.value}}
    # )
    
    # Placeholder
    return User(
        id=user_id,
        email="placeholder@example.com",
        username="placeholder",
        role=new_role,
        created_at=datetime.utcnow()
    )


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    current_user: TokenData = Depends(RequireRole(UserRole.ADMIN))
):
    """
    Delete a user (Admin only)
    """
    # In production: Delete from database
    # await db.users.delete_one({"id": user_id})
    
    return None


# Export router
__all__ = ['router']
