# DevFlow — College Competitive Programming Platform

A full-stack LeetCode/HackerRank-style platform built for college students.
Practice problems, compete in contests, and track your progress.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite) + TailwindCSS + Monaco Editor |
| Backend | Node.js + Express.js |
| Judge | Python + FastAPI |
| Database | MongoDB Atlas |
| Real-time | Socket.io |
| Auth | JWT + bcryptjs |
| Deployment | Vercel (frontend) + Render (backend + judge) |

---

## Project Structure

```
DevFlow/
├── frontend/          ← React app (Vite)
├── backend/           ← Node.js Express API
├── judge/             ← Python FastAPI code execution service
├── Docs/              ← Technical documentation
└── README.md
```

---

## Features

### Students
- Browse and solve problems with Monaco code editor
- Submit code in Python, C++, C, Java, JavaScript
- Real-time verdict: Accepted / Wrong Answer / TLE / Runtime Error / CE
- Run code against custom input
- Contest participation with live leaderboard
- Profile page with submission heatmap and stats
- Global leaderboard filtered by batch/branch

### Admins
- Create and manage problems with test cases
- Create and schedule contests
- Manage users and roles
- Platform-wide statistics dashboard

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB Atlas account
- Git

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/devflow.git
cd devflow
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Copy and configure environment variables:
```bash
cp .env.example .env
```

Edit `backend/.env`:
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/devflow
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_EXPIRE=7d
JUDGE_SERVICE_URL=http://localhost:8000
JUDGE_API_KEY=judge_internal_secret_key_change_this
CLIENT_URL=http://localhost:5173
EMAIL_SERVICE=gmail
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_gmail_app_password
```

Create the first superadmin:
```bash
node scripts/createAdmin.js
```

Start the backend:
```bash
npm run dev
```

---

### 3. Judge Service Setup

```bash
cd judge
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Copy and configure environment variables:
```bash
cp .env.example .env
```

Edit `judge/.env`:
```env
API_KEY=judge_internal_secret_key_change_this
MAX_CONCURRENT=5
DEFAULT_TIMEOUT=5
```

Start the judge service:
```bash
uvicorn main:app --reload --port 8000
```

---

### 4. Frontend Setup

```bash
cd frontend
npm install
```

Copy and configure environment variables:
```bash
cp .env.example .env
```

Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
```

Start the frontend:
```bash
npm run dev
```

---

## Default Admin Credentials

After running `node scripts/createAdmin.js`:

| Field | Value |
|-------|-------|
| Email | admin@college.edu |
| Password | Admin@123 |
| Role | superadmin |

> Change the password after first login.

---

## API Overview

| Base URL | Service |
|----------|---------|
| `http://localhost:5000/api/v1` | Node.js Backend |
| `http://localhost:8000` | Python Judge |

### Key Endpoints

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/problems
GET    /api/v1/problems/:slug
POST   /api/v1/submissions
POST   /api/v1/submissions/run
GET    /api/v1/contests
POST   /api/v1/contests/:id/register
GET    /api/v1/users/leaderboard
```

---

## Supported Languages

| Language | Extension | Execution |
|----------|-----------|-----------|
| Python | .py | python3 |
| C++ | .cpp | g++ → binary |
| C | .c | gcc → binary |
| Java | .java | javac → java |
| JavaScript | .js | node |

---

## Deployment

### Frontend → Vercel
1. Push `frontend/` to GitHub
2. Connect to Vercel → set build command `npm run build`, output `dist`
3. Add env vars: `VITE_API_URL`, `VITE_SOCKET_URL`

### Backend → Render
1. Push `backend/` to GitHub
2. New Web Service → Runtime: Node → Start: `node server.js`
3. Add all env vars from `.env`

### Judge → Render
1. Push `judge/` to GitHub
2. New Web Service → Runtime: Python → Start: `uvicorn main:app --host 0.0.0.0 --port 10000`
3. Add `API_KEY` env var
4. Install system deps (gcc, g++, java, node) via build script

### Database → MongoDB Atlas
1. Create free M0 cluster
2. Create DB user, whitelist `0.0.0.0/0`
3. Copy connection string to `MONGO_URI`

---

## Environment Variables Reference

### backend/.env
```env
NODE_ENV=
PORT=
MONGO_URI=
JWT_SECRET=
JWT_EXPIRE=
JUDGE_SERVICE_URL=
JUDGE_API_KEY=
CLIENT_URL=
EMAIL_SERVICE=
EMAIL_USER=
EMAIL_PASS=
```

### frontend/.env
```env
VITE_API_URL=
VITE_SOCKET_URL=
```

### judge/.env
```env
API_KEY=
MAX_CONCURRENT=
DEFAULT_TIMEOUT=
```

---

## Security Notes

- User code runs in isolated temp directories (UUID-based), deleted after execution
- Subprocess timeout enforced — no infinite loops possible
- Judge service only accepts requests with the correct `X-API-Key` header
- Passwords hashed with bcrypt (saltRounds=12)
- JWT-based stateless authentication
- Rate limiting on all API endpoints
- Admin solutions never sent to frontend
- Hidden test cases never exposed in API responses

---

## License

MIT
