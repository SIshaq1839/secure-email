from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'securebridge-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()


# Define Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    email: str
    name: str
    created_at: str


class AuthResponse(BaseModel):
    user: UserResponse
    token: str
    message: str


class MessageCreate(BaseModel):
    recipient_email: EmailStr
    subject: str
    body: str


class MessageResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    recipient_email: str
    sender_email: Optional[str] = None
    sender_name: Optional[str] = None
    subject: str
    body: str
    is_read: bool
    created_at: str


class SendMessageResponse(BaseModel):
    message_id: str
    inbox_url: str
    message: str


# Helper Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


def create_token(user_id: str, email: str) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": expiration
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# Health check endpoint
@api_router.get("/")
async def root():
    return {"message": "SecureBridge API is running"}


# Auth Endpoints
@api_router.post("/auth/register", response_model=AuthResponse)
async def register(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password": hash_password(user_data.password),
        "created_at": created_at
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, user_data.email)
    
    return AuthResponse(
        user=UserResponse(id=user_id, email=user_data.email, name=user_data.name, created_at=created_at),
        token=token,
        message="Registration successful"
    )


@api_router.post("/auth/login", response_model=AuthResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_token(user["id"], user["email"])
    
    return AuthResponse(
        user=UserResponse(id=user["id"], email=user["email"], name=user["name"], created_at=user["created_at"]),
        token=token,
        message="Login successful"
    )


@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)


# Send a new secure message (can be done by anyone, even without auth)
@api_router.post("/send", response_model=SendMessageResponse)
async def send_message(message_data: MessageCreate, credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))):
    message_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    
    # Get sender info if authenticated
    sender_email = None
    sender_name = None
    if credentials:
        try:
            token = credentials.credentials
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
            if user:
                sender_email = user["email"]
                sender_name = user["name"]
        except:
            pass
    
    message_doc = {
        "id": message_id,
        "recipient_email": message_data.recipient_email,
        "sender_email": sender_email,
        "sender_name": sender_name,
        "subject": message_data.subject,
        "body": message_data.body,
        "is_read": False,
        "created_at": created_at
    }
    
    await db.messages.insert_one(message_doc)
    
    # Get the frontend URL from environment or use default
    frontend_url = os.environ.get('FRONTEND_URL', '')
    inbox_url = f"{frontend_url}/inbox/{message_id}"
    
    return SendMessageResponse(
        message_id=message_id,
        inbox_url=inbox_url,
        message="Message sent securely. Share the inbox URL with the recipient."
    )


# Get a specific message by ID (marks as read) - requires auth and must be recipient
@api_router.get("/message/{message_id}", response_model=MessageResponse)
async def get_message(message_id: str, current_user: dict = Depends(get_current_user)):
    # Find the message
    message = await db.messages.find_one({"id": message_id}, {"_id": 0})
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Check if user is the recipient
    if message["recipient_email"] != current_user["email"]:
        raise HTTPException(status_code=403, detail="You don't have permission to view this message")
    
    # Mark as read
    await db.messages.update_one({"id": message_id}, {"$set": {"is_read": True}})
    message["is_read"] = True
    
    return MessageResponse(**message)


# Get all messages for the current user (inbox)
@api_router.get("/messages", response_model=List[MessageResponse])
async def get_messages(current_user: dict = Depends(get_current_user)):
    messages = await db.messages.find(
        {"recipient_email": current_user["email"]}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    return [MessageResponse(**msg) for msg in messages]


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
