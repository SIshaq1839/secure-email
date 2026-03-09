# Building SecureBridge with Emergent AI and Moving Toward Production Ready

I wanted to experiment with an AI coding tool and see how quickly a secure messaging application can be created and then moved toward a production-ready architecture.

For this experiment, I decided to build a secure "Notification-to-Portal" messaging system with:
• A Send Message page where users can compose secure messages
• An Inbox page where recipients can view messages sent to their email
• A Message Detail page with secure viewing and a "Secure Connection" badge

I chose **Emergent AI** to create this application.

---

## 1. Creating the Project in Emergent

First, I signed up for Emergent using my email. After signing in, it moved me to the project creation screen where I could describe what I wanted to build.

I provided the following prompt to Emergent:

---

## 2. Emergent Prompt – SecureBridge POC

```
Prompt for Emergent AI: SecureBridge POC

Project Role: Senior Full-Stack Engineer 
Task: Build a functional and elegantly designed Proof of Concept (POC) 
for a secure "Notification-to-Portal" messaging system.

1. Technical Architecture:
   Backend: Python (FastAPI).
   Frontend: React (Vite) + Tailwind CSS.
   Database: Messages table with id (UUID), recipient_email, subject, 
   body, is_read (bool), created_at.

2. Core Functional Workflow:
   Step 1 (The Trigger): Create a FastAPI endpoint POST /api/send that 
   accepts an email and a message body. It saves the data and returns 
   a unique URL.
   
   Step 2 (The Entry): In React, create a route /inbox/:id. On load, 
   it fetches the message from the backend.
   
   Step 3 (The Engagement): The backend GET /api/message/{id} endpoint 
   must automatically set is_read = True when called.

3. Design Specifications:
   Style: Minimalist, high-end SaaS aesthetic. 
   Use a "Clean & Quiet" palette: White background, Light Gray borders, 
   and a single Primary Blue (#2563EB) for actions.
   
   Typography: Use a clean Sans-Serif font (Inter/System).
   
   Dashboard UI: A centered list of messages. Unread messages have a 
   bold subject and a small blue dot. Read messages are slightly faded.
   
   Detail View UI: Display message in a focused, elegant white card 
   with a "Secure Connection" indicator (lock icon) and "Return to Inbox" button.

4. Implementation Goal: 
   Focus on seamless transition from URL link to secure in-app content. 
   Ensure the UI feels fast, responsive, and professional.
```

---

## 3. Generating the Application

I pasted the prompt into Emergent's project description window.

During project creation, Emergent's AI assistant asked me a few clarifying questions about database preference, authentication requirements, and additional features.

I told the assistant to proceed with whatever is easiest.

After that, Emergent started generating the project automatically.

Within a short time it created the full application using the prompt.

---

## 4. Generated SecureBridge Interface

The generated application included a Send Message page with a clean form to compose secure messages. It had fields for recipient email, subject, and message body with a "Send Secure Message" button.

It also included an Inbox page showing the message list with unread indicators (blue dots for unread messages, faded styling for read messages).

The Message Detail page displayed the secure message in an elegant white card with a "Secure Connection" badge showing a lock icon.

---

## 5. Adding User Authentication

At this stage the basic messaging was working, but I wanted each user to have their own private inbox.

I asked Emergent:

```
make a login module to login and check their email
every user will have their own inbox,
```

Emergent added:
• A Registration page with name, email, and password fields
• A Login page with JWT authentication
• User-specific inboxes where users only see messages sent to their email
• Protected routes requiring authentication to access the inbox
• Password hashing with bcrypt for security

The entire authentication system was built and tested within minutes.

---

## 6. Tech Stack Summary

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

## 7. Moving Toward Production Ready

At this stage the application was working, but I wanted to make the system production ready.

For this purpose, I can export the project and move it into my own controlled environment.

---

## 8. Exporting Code to GitHub

I connected the Emergent project to my GitHub repository and exported the entire codebase.

This creates a complete copy of the project including:
• Backend code (FastAPI server, models, authentication)
• Frontend code (React components, pages, styles)
• Configuration files (requirements.txt, package.json)
• Environment variable templates

---

## 9. Running Locally

Once exported to GitHub, I cloned the repository and ran it locally.

**Backend Setup:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --reload --port 8001
```

**Frontend Setup:**
```bash
cd frontend
yarn install
yarn start
```

**Environment Variables:**

Backend `.env`:
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=securebridge
JWT_SECRET=your-secret-key-here
CORS_ORIGINS=*
```

Frontend `.env`:
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

---

## 10. Dockerizing the Environment

Once the backend and frontend were ready and integrated with each other, I can create Docker images for both services.

**Backend Dockerfile:**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8001
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

**Frontend Dockerfile:**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Docker Compose:**
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  backend:
    build: ./backend
    ports:
      - "8001:8001"
    environment:
      - MONGO_URL=mongodb://mongodb:27017
      - DB_NAME=securebridge
      - JWT_SECRET=your-secret-key
    depends_on:
      - mongodb

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  mongo_data:
```

Now I can start the entire system using containers:
```bash
docker-compose up -d
```

Whenever I need to deploy this project, I can deploy the application on AWS ECS using the container images stored in Amazon ECR.

---

*Built with [Emergent AI](https://emergent.sh)*
