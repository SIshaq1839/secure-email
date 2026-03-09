# SecureBridge

A secure "Notification-to-Portal" messaging system where sensitive content never sits in email inboxes.

## Features

- **Send Secure Messages** — Create messages that generate unique portal URLs
- **User Authentication** — Register/login with email and password
- **Private Inboxes** — Users only see messages sent to their email
- **Read Tracking** — Messages auto-mark as read when viewed
- **Secure Connection Badge** — Visual indicator for secure viewing

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | FastAPI (Python) |
| Database | MongoDB |
| Frontend | React + Tailwind CSS |
| UI Components | shadcn/ui |
| Authentication | JWT + bcrypt |

## Running Locally

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn server:app --reload --port 8001
```

Create `backend/.env`:
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=securebridge
JWT_SECRET=your-secret-key-here
CORS_ORIGINS=*
```

### Frontend
```bash
cd frontend
yarn install
yarn start
```

Create `frontend/.env`:
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

## Running with Docker

```bash
docker-compose up -d
```

Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Create new account |
| POST | /api/auth/login | Login and get token |
| GET | /api/auth/me | Get current user |
| POST | /api/send | Send secure message |
| GET | /api/messages | Get inbox (auth required) |
| GET | /api/message/{id} | View message (auth required) |

## License

MIT

---

*Built with [Emergent AI](https://emergent.sh)*
