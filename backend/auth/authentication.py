"""
Authentication & Authorization System

JWT-based authentication with role-based access control (RBAC)
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, OAuth2PasswordBearer
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, List
from pydantic import BaseModel, EmailStr
from enum import Enum
import secrets

# ============================================================
# Configuration
# ============================================================

SECRET_KEY = secrets.token_urlsafe(32)  # Change in production!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security schemes
security = HTTPBearer()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


# ============================================================
# Models
# ============================================================

class UserRole(str, Enum):
    """User roles with different permissions"""
    VIEWER = "viewer"           # Read-only access
    ANALYST = "analyst"         # Read + limited write
    ADMIN = "admin"            # Full access
    API_USER = "api_user"      # API-only access


class Permission(str, Enum):
    """Granular permissions"""
    READ_SATELLITES = "read:satellites"
    READ_CONJUNCTIONS = "read:conjunctions"
    WRITE_SATELLITES = "write:satellites"
    WRITE_CONJUNCTIONS = "write:conjunctions"
    READ_ANALYTICS = "read:analytics"
    MANAGE_USERS = "manage:users"
    MANAGE_SYSTEM = "manage:system"


# Role-Permission mapping
ROLE_PERMISSIONS = {
    UserRole.VIEWER: [
        Permission.READ_SATELLITES,
        Permission.READ_CONJUNCTIONS,
        Permission.READ_ANALYTICS
    ],
    UserRole.ANALYST: [
        Permission.READ_SATELLITES,
        Permission.READ_CONJUNCTIONS,
        Permission.READ_ANALYTICS,
        Permission.WRITE_CONJUNCTIONS
    ],
    UserRole.ADMIN: list(Permission),  # All permissions
    UserRole.API_USER: [
        Permission.READ_SATELLITES,
        Permission.READ_CONJUNCTIONS
    ]
}


class User(BaseModel):
    """User model"""
    id: str
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    role: UserRole
    is_active: bool = True
    is_verified: bool = False
    api_key: Optional[str] = None
    created_at: datetime
    last_login: Optional[datetime] = None


class UserCreate(BaseModel):
    """User registration model"""
    email: EmailStr
    username: str
    password: str
    full_name: Optional[str] = None
    role: UserRole = UserRole.VIEWER


class UserLogin(BaseModel):
    """Login credentials"""
    email: EmailStr
    password: str


class Token(BaseModel):
    """JWT token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenData(BaseModel):
    """Decoded token data"""
    user_id: str
    email: str
    role: UserRole
    permissions: List[Permission]


# ============================================================
# Password Utilities
# ============================================================

def hash_password(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against hash"""
    return pwd_context.verify(plain_password, hashed_password)


# ============================================================
# JWT Utilities
# ============================================================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """Create JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> TokenData:
    """Decode and validate JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        role: str = payload.get("role")
        
        if user_id is None or email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        # Get permissions for role
        user_role = UserRole(role)
        permissions = ROLE_PERMISSIONS.get(user_role, [])
        
        return TokenData(
            user_id=user_id,
            email=email,
            role=user_role,
            permissions=permissions
        )
    
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ============================================================
# Authentication Dependencies
# ============================================================

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> TokenData:
    """Get current authenticated user from token"""
    token = credentials.credentials
    return decode_token(token)


async def get_current_active_user(
    current_user: TokenData = Depends(get_current_user)
) -> TokenData:
    """Get current active user"""
    # In production, check if user is active in database
    return current_user


# ============================================================
# Permission Checking
# ============================================================

class RequirePermission:
    """Dependency to check if user has required permission"""
    
    def __init__(self, permission: Permission):
        self.permission = permission
    
    async def __call__(
        self,
        current_user: TokenData = Depends(get_current_active_user)
    ) -> TokenData:
        if self.permission not in current_user.permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {self.permission.value} required"
            )
        return current_user


class RequireRole:
    """Dependency to check if user has required role"""
    
    def __init__(self, required_role: UserRole):
        self.required_role = required_role
    
    async def __call__(
        self,
        current_user: TokenData = Depends(get_current_active_user)
    ) -> TokenData:
        if current_user.role != self.required_role and current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role {self.required_role.value} required"
            )
        return current_user


# ============================================================
# API Key Authentication (Alternative)
# ============================================================

def verify_api_key(api_key: str) -> Optional[User]:
    """Verify API key and return user"""
    # In production, check against database
    # For now, placeholder
    if api_key.startswith("sk_"):
        return None  # Placeholder for database lookup
    return None


async def get_user_from_api_key(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Optional[User]:
    """Get user from API key"""
    api_key = credentials.credentials
    
    if not api_key.startswith("sk_"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key format"
        )
    
    user = verify_api_key(api_key)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    
    return user


# ============================================================
# User Management
# ============================================================

class UserManager:
    """User management operations"""
    
    @staticmethod
    def generate_api_key() -> str:
        """Generate a new API key"""
        return f"sk_{secrets.token_urlsafe(32)}"
    
    @staticmethod
    async def create_user(user_data: UserCreate) -> User:
        """Create a new user"""
        # Hash password
        hashed_password = hash_password(user_data.password)
        
        # Create user
        user = User(
            id=secrets.token_urlsafe(16),
            email=user_data.email,
            username=user_data.username,
            full_name=user_data.full_name,
            role=user_data.role,
            created_at=datetime.utcnow()
        )
        
        # In production: Save to database
        # await db.users.insert_one({...})
        
        return user
    
    @staticmethod
    async def authenticate_user(email: str, password: str) -> Optional[User]:
        """Authenticate user by email and password"""
        # In production: Fetch from database
        # user = await db.users.find_one({"email": email})
        
        # Placeholder
        return None
    
    @staticmethod
    async def update_last_login(user_id: str):
        """Update user's last login timestamp"""
        # In production: Update database
        pass


# ============================================================
# Utility Functions
# ============================================================

def create_tokens_for_user(user: User) -> Token:
    """Create access and refresh tokens for user"""
    token_data = {
        "sub": user.id,
        "email": user.email,
        "role": user.role.value
    }
    
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


# Export
__all__ = [
    'User', 'UserCreate', 'UserLogin', 'Token', 'TokenData',
    'UserRole', 'Permission',
    'get_current_user', 'get_current_active_user',
    'RequirePermission', 'RequireRole',
    'hash_password', 'verify_password',
    'create_access_token', 'decode_token',
    'UserManager', 'create_tokens_for_user'
]
