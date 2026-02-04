from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class MessageCreate(BaseModel):
    recipient_email: EmailStr
    subject: str
    body: str


class MessageResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    recipient_email: str
    subject: str
    body: str
    is_read: bool
    created_at: str


class SendMessageResponse(BaseModel):
    message_id: str
    inbox_url: str
    message: str


# Health check endpoint
@api_router.get("/")
async def root():
    return {"message": "SecureBridge API is running"}


# Send a new secure message
@api_router.post("/send", response_model=SendMessageResponse)
async def send_message(message_data: MessageCreate):
    message_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    
    message_doc = {
        "id": message_id,
        "recipient_email": message_data.recipient_email,
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


# Get a specific message by ID (marks as read)
@api_router.get("/message/{message_id}", response_model=MessageResponse)
async def get_message(message_id: str):
    # Find and update the message to mark as read
    message = await db.messages.find_one_and_update(
        {"id": message_id},
        {"$set": {"is_read": True}},
        projection={"_id": 0},
        return_document=True
    )
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    return MessageResponse(**message)


# Get all messages (for inbox view)
@api_router.get("/messages", response_model=List[MessageResponse])
async def get_messages():
    messages = await db.messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
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
