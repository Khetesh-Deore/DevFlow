# DevFlow - Quick Start Guide

## Start Here! 🚀

This guide will help you get started with development immediately.

---

## 1. UNDERSTAND THE PROJECT (30 minutes)

### What You're Building
A **LeetCode-like competitive programming platform** where:
- Users solve coding problems
- Admins manage problems and testcases
- Code is evaluated automatically
- Users can host contests
- Problems can be scraped from other platforms

### Key Features
✅ Problem solving with code editor  
✅ Automated code evaluation  
✅ Admin panel for problem management  
✅ Web scraping for problem import  
✅ User-hosted contests  
✅ Real-time leaderboards  
✅ Custom testcases  

---

## 2. SETUP YOUR ENVIRONMENT (1 hour)

### Prerequisites
- Node.js 16+
- MongoDB Atlas account
- Upstash Redis account
- Docker installed
- Git

### Step 1: Clone & Setup Backend
```bash
cd backend
npm install

# Create .env file
cat > .env << EOF
MONGODB_URI=your_mongodb_connection_string
REDIS_HOST=your_redis_host
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:3000
NODE_ENV=development
PORT=5000
EOF

# Start backend
npm run dev
```

### Step 2: Setup Frontend
```bash
cd frontend
npm install

# Start frontend
npm start
```

### Step 3: Verify Setup
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- API Health: http://localhost:5000/api/health

---

## 3. FIRST TASK: USER AUTHENTICATION (2-3 hours)

### What to Implement
Users should be able to register and login.

### Files to Create/Modify

**1. Backend - User Model**
```typescript
// backend/src/models/User.ts
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin', 'host'], default: 'user' },
  rating: { type: Number, default: 0 },
  solvedProblems: [mongoose.Schema.Types.ObjectId],
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
  next();
});

export const User = mongoose.model('User', userSchema);
```

**2. Backend - Auth Routes**
```typescript
// backend/src/routes/authRoutes.ts
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User } from '../models/User';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const user = new User({ username, email, passwordHash: password });
    await user.save();
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user._id, username, email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }
    
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid password' });
    }
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user._id, username: user.username, email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

**3. Backend - Server Setup**
```typescript
// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes';

const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Routes
app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
```

**4. Frontend - Login Component**
```typescript
// frontend/src/components/Login.tsx
import React, { useState } from 'react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (data.token) {
        localStorage.setItem('token', data.token);
        alert('Login successful!');
      }
    } catch (error) {
      alert('Login failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};
```

### Testing
1. Open http://localhost:3000
2. Register a new user
3. Login with the user
4. Check browser console for token

---

## 4. SECOND TASK: PROBLEM LISTING (2-3 hours)

### What to Implement
Users should see a list of problems.

### Files to Create/Modify

**1. Backend - Problem Model**
```typescript
// backend/src/models/Problem.ts
const problemSchema = new mongoose.Schema({
  title: String,
  description: String,
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
  category: String,
  examples: [{
    input: String,
    output: String
  }],
  constraints: String,
  referenceSolution: {
    language: String,
    code: String
  },
  testcases: [{
    input: String,
    output: String
  }],
  acceptanceRate: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export const Problem = mongoose.model('Problem', problemSchema);
```

**2. Backend - Problem Routes**
```typescript
// backend/src/routes/problemRoutes.ts
router.get('/problems', async (req, res) => {
  try {
    const problems = await Problem.find()
      .select('-testcases -referenceSolution')
      .limit(20);
    
    res.json(problems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/problems/:id', async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id)
      .select('-testcases -referenceSolution');
    
    res.json(problem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**3. Frontend - Problem List Component**
```typescript
// frontend/src/components/ProblemList.tsx
import React, { useEffect, useState } from 'react';

export const ProblemList = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/problems');
        const data = await response.json();
        setProblems(data);
      } catch (error) {
        console.error('Error fetching problems', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProblems();
  }, []);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>Problems</h1>
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Difficulty</th>
            <th>Acceptance</th>
          </tr>
        </thead>
        <tbody>
          {problems.map(problem => (
            <tr key={problem._id}>
              <td>{problem.title}</td>
              <td>{problem.difficulty}</td>
              <td>{problem.acceptanceRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

### Testing
1. Add sample problems to MongoDB
2. Visit http://localhost:3000/problems
3. See the list of problems

---

## 5. THIRD TASK: CODE SUBMISSION (3-4 hours)

### What to Implement
Users should be able to submit code and see results.

### Files to Create/Modify

**1. Backend - Submission Model**
```typescript
// backend/src/models/Submission.ts
const submissionSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  problemId: mongoose.Schema.Types.ObjectId,
  language: String,
  code: String,
  verdict: { type: String, default: 'PENDING' },
  testcaseResults: [{
    passed: Boolean,
    output: String,
    expectedOutput: String
  }],
  createdAt: { type: Date, default: Date.now }
});

export const Submission = mongoose.model('Submission', submissionSchema);
```

**2. Backend - Submission Routes**
```typescript
// backend/src/routes/submissionRoutes.ts
router.post('/submissions/submit', authenticateToken, async (req, res) => {
  try {
    const { problemId, code, language } = req.body;
    
    // Create submission
    const submission = new Submission({
      userId: req.user.userId,
      problemId,
      code,
      language,
      verdict: 'PENDING'
    });
    
    await submission.save();
    
    // Add to queue for processing
    submissionQueue.add({
      submissionId: submission._id,
      userId: req.user.userId,
      problemId,
      code,
      language
    });
    
    res.json({ submissionId: submission._id, verdict: 'PENDING' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**3. Frontend - Code Editor Component**
```typescript
// frontend/src/components/CodeEditor.tsx
import React, { useState } from 'react';
import Editor from '@monaco-editor/react';

export const CodeEditor = ({ problemId }) => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('cpp');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/submissions/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ problemId, code, language })
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      alert('Submission failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <select value={language} onChange={(e) => setLanguage(e.target.value)}>
        <option value="cpp">C++</option>
        <option value="python">Python</option>
        <option value="java">Java</option>
        <option value="javascript">JavaScript</option>
      </select>
      
      <Editor
        height="400px"
        language={language}
        value={code}
        onChange={setCode}
        theme="vs-dark"
      />
      
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Submitting...' : 'Submit'}
      </button>
      
      {result && (
        <div>
          <h3>Result: {result.verdict}</h3>
        </div>
      )}
    </div>
  );
};
```

### Testing
1. Create a problem with testcases
2. Submit code
3. See verdict

---

## 6. NEXT STEPS

### Week 1
- [ ] Complete authentication
- [ ] Complete problem listing
- [ ] Complete code submission

### Week 2
- [ ] Setup Docker sandbox
- [ ] Setup Bull queue
- [ ] Implement code evaluation

### Week 3
- [ ] Create admin panel
- [ ] Add problem creation
- [ ] Add testcase management

### Week 4+
- [ ] Add web scraping
- [ ] Add contests
- [ ] Add real-time features
- [ ] Deploy to production

---

## 7. USEFUL COMMANDS

```bash
# Backend
npm run dev              # Start development server
npm run build           # Build TypeScript
npm test                # Run tests

# Frontend
npm start               # Start development server
npm run build           # Build for production
npm test                # Run tests

# Database
# MongoDB Atlas - use web interface
# Redis - use Upstash web interface

# Docker
docker ps               # List running containers
docker logs <id>        # View container logs
docker stop <id>        # Stop container
```

---

## 8. COMMON ISSUES & SOLUTIONS

### Issue: MongoDB connection fails
**Solution**: Check connection string in .env file

### Issue: Redis connection fails
**Solution**: Check Redis credentials in .env file

### Issue: CORS errors
**Solution**: Make sure CLIENT_URL in .env matches frontend URL

### Issue: Code execution fails
**Solution**: Make sure Docker is running

---

## 9. RESOURCES

- **Express.js**: https://expressjs.com
- **React**: https://react.dev
- **MongoDB**: https://docs.mongodb.com
- **Docker**: https://docs.docker.com
- **Socket.io**: https://socket.io/docs

---

## 10. GET HELP

1. Check the error message carefully
2. Search for the error online
3. Check the documentation
4. Ask in developer communities

---

**You're ready to start! Begin with Task 1 (Authentication) and follow the roadmap. Good luck! 🚀**

