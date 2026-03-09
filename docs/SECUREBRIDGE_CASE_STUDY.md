# Building SecureBridge with Emergent AI: A Secure Messaging POC

I wanted to experiment with an AI coding assistant to see how quickly a secure messaging application could be built from scratch.

For this experiment, I decided to build **SecureBridge** — a secure "Notification-to-Portal" messaging system where sensitive content never sits in email inboxes.

I chose **Emergent AI** to create this application.

---

## 1. The Idea Behind SecureBridge

The concept is simple but powerful:
- Instead of sending sensitive information directly via email, send a **secure link**
- The recipient clicks the link and views the message in a **secure portal**
- The actual content stays protected, never exposed in email

This pattern is commonly used in healthcare, finance, and legal industries.

---

## 2. Creating the Project in Emergent

After signing into Emergent, I described what I wanted to build:

> *"Build a functional and elegantly designed Proof of Concept for a secure Notification-to-Portal messaging system. Users can send messages that generate unique URLs. Recipients access messages through a secure portal with a clean, minimalist SaaS design."*

Emergent's AI assistant (E1) immediately asked clarifying questions:
- Database preference (MongoDB was already configured)
- Port configuration
- Authentication requirements
- Additional features like message expiration

This back-and-forth helped refine the requirements before any code was written.

---

## 3. What Emergent Built Automatically

Within minutes, Emergent generated:

### Backend (FastAPI + Python)
- `POST /api/send` — Creates a message and returns a unique secure URL
- `GET /api/message/{id}` — Retrieves message and marks it as read
- `GET /api/messages` — Lists all messages in inbox

### Frontend (React + Tailwind CSS)
- **Send Message Page** — Clean form to compose secure messages
- **Inbox Page** — Message list with read/unread indicators
- **Message Detail Page** — Secure viewing with "Secure Connection" badge

### Design
- Modern, minimalist SaaS aesthetic
- White background with subtle gray borders
- Primary blue (#2563EB) for actions
- Inter font for clean typography

![Send Message Interface](screenshot_send.png)

![Inbox with Unread Indicators](screenshot_inbox.png)

![Secure Message View](screenshot_detail.png)

---

## 4. Adding User Authentication

After the initial build, I asked Emergent to add a login system so each user could have their own inbox.

I simply typed:
> *"Make a login module to login and check their email. Every user will have their own inbox."*

Emergent added:
- **Registration page** with name, email, password
- **Login page** with JWT authentication
- **User-specific inboxes** — Users only see messages sent to their email
- **Protected routes** — Inbox requires authentication
- **Password hashing** with bcrypt for security

The entire authentication system was built and tested within minutes.

---

## 5. Tech Stack Summary

| Component | Technology |
|-----------|------------|
| Backend | FastAPI (Python) |
| Database | MongoDB (with Motor async driver) |
| Frontend | React + Tailwind CSS |
| UI Components | shadcn/ui |
| Authentication | JWT (PyJWT) + bcrypt |
| Styling | Inter font, Clean & Quiet palette |
| API Validation | Pydantic |

---

## 6. Testing & Quality

Emergent automatically ran tests after each feature:
- Backend API tests (all endpoints)
- Frontend integration tests
- End-to-end user flow testing

Test results: **100% pass rate** on all critical functionality.

---

## 7. Downloading and Running Locally

One of the great features of Emergent is that you own your code. Here's how to download and run SecureBridge on your own machine:

### Step 1: Export to GitHub
In Emergent, click the **GitHub** button to push your code to a repository. This creates a complete copy of your project.

### Step 2: Clone the Repository
```
git clone https://github.com/your-username/securebridge.git
cd securebridge
```

### Step 3: Set Up the Backend
```
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the backend folder:
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=securebridge
JWT_SECRET=your-secret-key-here
CORS_ORIGINS=*
```

Start the backend:
```
uvicorn server:app --reload --port 8001
```

### Step 4: Set Up the Frontend
```
cd frontend
yarn install
```

Create a `.env` file in the frontend folder:
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

Start the frontend:
```
yarn start
```

### Step 5: Set Up MongoDB
Make sure MongoDB is running locally:
```
# Install MongoDB (if not installed)
# macOS: brew install mongodb-community
# Ubuntu: sudo apt install mongodb

# Start MongoDB
mongod --dbpath /data/db
```

Or use **MongoDB Atlas** (free cloud tier):
1. Create account at mongodb.com/atlas
2. Create a free cluster
3. Get connection string and update `.env`:
```
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net
```

That's it! Your SecureBridge app is now running locally at `http://localhost:3000`

---

## 8. Running with Docker (Recommended for Production)

Docker makes it easy to run the entire application with a single command.

### Step 1: Create Backend Dockerfile

Create `backend/Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

### Step 2: Create Frontend Dockerfile

Create `frontend/Dockerfile`:
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

Create `frontend/nginx.conf`:
```nginx
server {
    listen 80;
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

### Step 3: Create Docker Compose File

Create `docker-compose.yml` in the root folder:
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6
    container_name: securebridge-db
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

  backend:
    build: ./backend
    container_name: securebridge-backend
    ports:
      - "8001:8001"
    environment:
      - MONGO_URL=mongodb://mongodb:27017
      - DB_NAME=securebridge
      - JWT_SECRET=${JWT_SECRET:-your-secret-key-change-in-production}
      - CORS_ORIGINS=*
    depends_on:
      - mongodb
    restart: unless-stopped

  frontend:
    build: 
      context: ./frontend
      args:
        - REACT_APP_BACKEND_URL=${BACKEND_URL:-http://localhost:8001}
    container_name: securebridge-frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  mongo_data:
```

### Step 4: Run Everything with One Command
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

Your app is now running:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001
- MongoDB: localhost:27017

---

## 9. Deploying to Production

### Option A: Deploy to a VPS (DigitalOcean, AWS EC2, etc.)

1. **Set up your server** with Docker installed
2. **Clone your repository** to the server
3. **Create production `.env`** file:
```bash
JWT_SECRET=generate-a-strong-secret-key-here
BACKEND_URL=https://api.yourdomain.com
```

4. **Run with Docker Compose**:
```bash
docker-compose -f docker-compose.yml up -d
```

5. **Set up reverse proxy** (Nginx/Caddy) for SSL:
```nginx
# /etc/nginx/sites-available/securebridge
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
    }
}

server {
    listen 443 ssl;
    server_name api.yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:8001;
    }
}
```

### Option B: Deploy Frontend to Vercel/Netlify

1. **Push frontend to GitHub**
2. **Connect to Vercel/Netlify**
3. **Set environment variable**:
   - `REACT_APP_BACKEND_URL` = your backend API URL

### Option C: Deploy Backend to Railway/Render

1. **Push backend to GitHub**
2. **Connect to Railway or Render**
3. **Set environment variables**:
   - `MONGO_URL` = your MongoDB Atlas connection string
   - `DB_NAME` = securebridge
   - `JWT_SECRET` = your secret key
   - `CORS_ORIGINS` = your frontend URL

### Option D: Use MongoDB Atlas for Database

For production, use MongoDB Atlas instead of self-hosted MongoDB:
1. Create free cluster at mongodb.com/atlas
2. Whitelist your server IP
3. Update `MONGO_URL` in your environment

---

## 10. Moving Toward Compliance

Once running in production, you have full control to add compliance features:

Once running locally, you have full control to:

- **Add email integration** — Send notification emails with secure links (Resend, SendGrid)
- **Deploy to your infrastructure** — AWS, Google Cloud, Vercel, or any hosting provider
- **Switch databases** — Migrate to Firestore, PostgreSQL, or any database of your choice
- **Add compliance features** — Audit logging, activity tracking, data retention policies
- **Customize the design** — Modify styles, add your branding
- **Enhance security** — Add 2FA, session management, IP restrictions

---

## 9. Key Takeaways

| Aspect | My Experience |
|--------|---------------|
| **Speed** | Full working app in under 30 minutes |
| **Quality** | Production-ready code with proper architecture |
| **Design** | Modern, professional UI without manual design work |
| **Flexibility** | Easy to add features through natural conversation |
| **Ownership** | Full code export, run anywhere |

---

## 10. What's Next?

Future enhancements I'm considering:
- Email notifications when messages are sent
- Message expiration (auto-delete after X days)
- File attachments
- Read receipts
- Admin dashboard

---

## Conclusion

Building SecureBridge with Emergent AI was remarkably fast and intuitive. The conversational approach meant I could describe what I wanted in plain English, and the AI handled the technical implementation.

The ability to export and run locally gives complete ownership and flexibility for production deployment or compliance requirements.

Whether you're building a quick prototype or starting a production application, Emergent provides a powerful way to go from idea to working software in minutes.

---

*Built with [Emergent AI](https://emergent.sh)*
