# DevFlow

A modern competitive programming platform built for college students to practice coding problems, participate in live contests, and track their progress.

![DevFlow](https://img.shields.io/badge/DevFlow-Competitive%20Programming-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![MongoDB](https://img.shields.io/badge/MongoDB-5.0%2B-green)

## 🚀 Features

### Core Features
- **Multi-Language Support**: Write code in Python, C++, C, Java, and JavaScript
- **Live Contests**: Participate in timed contests with real-time leaderboards
- **Problem Library**: Access hundreds of problems categorized by difficulty and tags
- **Instant Judging**: Get immediate feedback with our fast online judge system
- **Progress Tracking**: Track solved problems, ratings, and submission history
- **User Profiles**: View detailed statistics, heatmaps, and achievement badges

### Contest Features
- **Copy-Paste Protection**: Disabled during live contests for fair competition
- **Real-Time Timer**: Live countdown with visual alerts
- **Hidden Test Cases**: Prevent hardcoded solutions
- **Live Leaderboards**: Real-time rankings with automatic updates
- **Problem Switching**: Quick navigation between contest problems
- **Submission History**: Track all attempts with detailed results

### Editor Features
- **Monaco Editor**: Professional code editor with syntax highlighting
- **Auto-Completion**: Intelligent code suggestions
- **Session Persistence**: Code saved automatically per problem
- **Resizable Panels**: Drag-to-resize problem statement and editor
- **Fullscreen Mode**: Distraction-free coding experience
- **Template Reset**: Quick reset to language templates

### Security & Fair Play
- **Rate Limiting**: Prevent spam and abuse
- **JWT Authentication**: Secure user sessions
- **Role-Based Access**: Admin, user, and guest roles
- **Copy-Paste Blocking**: Active during contests
- **Hidden Test Cases**: Ensure solution quality

## 🏗️ Architecture

```
DevFlow/
├── frontend/          # React + Vite + TailwindCSS
├── backend/           # Node.js + Express + MongoDB
├── judge/             # Python FastAPI code execution service
└── Docs/              # Technical documentation
```

### Tech Stack

**Frontend:**
- React 18 with Vite
- TailwindCSS for styling
- Monaco Editor for code editing
- React Query for data fetching
- Zustand for state management
- React Router for navigation

**Backend:**
- Node.js + Express
- MongoDB with Mongoose
- JWT authentication
- Socket.io for real-time updates
- Rate limiting with express-rate-limit

**Judge Service:**
- Python FastAPI
- Docker containers for code isolation
- Support for 5 programming languages
- Time and memory limit enforcement

## 📦 Installation

### Prerequisites
- Node.js >= 18.0.0
- MongoDB >= 5.0
- Python >= 3.9
- Docker (optional, for judge service)

### 1. Clone Repository
```bash
git clone https://github.com/khetesh-deore/devflow.git
cd devflow
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env with your MongoDB URI and secrets

# Start backend
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Create .env file
cp .env.example .env
# Edit .env with backend API URL

# Start frontend
npm run dev
```

### 4. Judge Service Setup
```bash
cd judge
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with API key

# Start judge service
python main.py
```

## 🔧 Configuration

### Backend Environment Variables
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/devflow
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d
NODE_ENV=development
JUDGE_SERVICE_URL=http://localhost:8000
JUDGE_API_KEY=judge_internal_secret_key
```

### Frontend Environment Variables
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
```

### Judge Service Environment Variables
```env
API_KEY=judge_internal_secret_key
PORT=8000
```

## 🎯 Usage

### Creating Admin User
```bash
cd backend
node scripts/createAdmin.js
```

### Adding Problems
1. Login as admin
2. Navigate to Admin Panel
3. Click "Add Problem"
4. Fill in problem details and test cases
5. Publish problem

### Creating Contests
1. Login as admin
2. Navigate to Admin Panel → Contests
3. Click "Create Contest"
4. Add problems and configure settings
5. Publish contest

## 📊 Database Schema

### User Model
- Authentication (email, password, rollNumber)
- Profile (name, bio, college)
- Stats (solved problems, streak, ratings)
- Solved problems array

### Problem Model
- Title, description, difficulty
- Input/output format, constraints
- Sample and hidden test cases
- Tags and hints
- Acceptance rate

### Contest Model
- Title, description, type
- Start/end time, duration
- Problems with points
- Scoring rules and penalties

### Submission Model
- User, problem, contest references
- Code, language, status
- Test case results
- Time and memory usage

## 🔐 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: 
  - General API: 1000 requests/15min
  - Auth: 5 requests/15min
  - Submissions: 10 requests/15min
- **Input Validation**: Sanitized user inputs
- **CORS Protection**: Configured allowed origins
- **Copy-Paste Blocking**: Active during contests

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd frontend
vercel --prod
```

### Backend (Render/Railway)
```bash
# Push to GitHub
# Connect repository to Render/Railway
# Set environment variables
# Deploy
```

### Judge Service (Google Cloud Run)
```bash
cd judge
gcloud run deploy devflow-judge \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated
```

## 📈 Performance

- **Response Time**: < 100ms for API calls
- **Judge Execution**: 2-5 seconds per submission
- **Concurrent Users**: Supports 200+ simultaneous users
- **Database**: Optimized indexes for fast queries
- **Caching**: React Query for client-side caching

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Khetesh Deore** - Initial work - [GitHub](https://github.com/khetesh-deore)

## 🙏 Acknowledgments

- Monaco Editor for the code editor
- LeetCode and Codeforces for inspiration
- All contributors and testers



## 🗺️ Roadmap

- [ ] AI-powered hints and explanations
- [ ] Video editorial solutions
- [ ] Discussion forums
- [ ] Mobile app (React Native)
- [ ] Company-specific problem sets
- [ ] Interview preparation tracks
- [ ] Peer code review system
- [ ] Virtual contests with friends

<!-- ## 📸 Screenshots -->

<!-- ### Home Page
Modern landing page with features and rules

### Problem Solving
Split-panel interface with resizable sections

### Live Contest
Real-time timer, leaderboard, and problem navigation

### Profile Dashboard
Statistics, heatmap, and submission history -->

---

Built with ❤️ for competitive programmers
