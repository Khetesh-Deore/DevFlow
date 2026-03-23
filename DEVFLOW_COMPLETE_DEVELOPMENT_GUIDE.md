# DevFlow - Complete Development Guide
## Production-Ready Competitive Programming Platform

**Version**: 1.0  
**Date**: March 23, 2026  
**Status**: Development Specification  

---

## 1. PROJECT VISION

### What We're Building
A **production-grade competitive programming platform** that combines:
- LeetCode-like problem-solving interface
- Admin panel for problem/testcase management
- Automated code evaluation system
- User-hosted contests
- Web scraping for problem import
- Custom testcase support
- Real-time leaderboards

### Target Users
- **Problem Solvers**: Practice coding problems
- **Admins**: Manage problems and testcases
- **Contest Hosts**: Create and manage contests
- **Participants**: Join and compete in contests

### Success Metrics
- Support 200+ concurrent users
- Code evaluation in <5 seconds
- 99.9% uptime
- Sub-100ms API response times

---

## 2. CORE FEATURES

### 2.1 User Management
- User registration and authentication
- User profiles with statistics
- Role-based access (User, Admin, Host)
- User ratings and rankings

### 2.2 Problem Management
- Browse problems with filters (difficulty, category, status)
- View problem details (description, constraints, examples)
- Track solved/attempted problems
- Problem statistics (acceptance rate, difficulty)

### 2.3 Code Submission & Evaluation
- Code editor with syntax highlighting
- Multiple language support (C++, Python, Java, JavaScript)
- Submit code for evaluation
- Real-time verdict (AC, WA, TLE, RE, CE, MLE)
- View submission history

### 2.4 Admin Panel
- Add new problems
- Create testcases (input/output pairs)
- Add reference solution
- Edit/delete problems
- View problem statistics

### 2.5 Web Scraping
- Import problems from LeetCode, Codeforces, GeeksforGeeks
- Auto-extract problem details
- Manual testcase addition option

### 2.6 Contest Management
- Create contests (by any user)
- Set contest duration and problems
- Real-time leaderboard
- Contest standings
- Submission tracking

### 2.7 Custom Testcases
- Users can add custom testcases
- Test code before submission
- View custom testcase results

---

## 3. TECHNOLOGY STACK

### Frontend
- React 18 with TypeScript
- Vite (build tool)
- Tailwind CSS + Shadcn/UI
- Monaco Editor (code editor)
- Socket.io-client (real-time)
- React Router (navigation)
- Zustand + React Query (state management)

### Backend
- Node.js + Express
- TypeScript
- MongoDB + Mongoose
- Redis (caching + queue)
- Bull (job queue)
- Socket.io (real-time)
- Docker (code execution)
- Selenium (web scraping)

### Infrastructure
- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas
- Cache: Upstash Redis
- Storage: Cloudflare R2
- Execution: Docker containers

---

## 4. DATABASE SCHEMA

### User Collection
```javascript
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  passwordHash: String,
  role: "user" | "admin" | "host",
  rating: Number,
  solvedProblems: [ObjectId],
  attemptedProblems: [ObjectId],
  submissions: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}
```

### Problem Collection
```javascript
{
  _id: ObjectId,
  title: String,
  description: String (markdown),
  difficulty: "Easy" | "Medium" | "Hard",
  category: String,
  tags: [String],
  
  // Examples from problem statement
  examples: [{
    input: String,
    output: String,
    explanation: String
  }],
  
  constraints: String,
  
  // Reference solution
  referenceSolution: {
    language: String,
    code: String,
    source: "manual" | "ai" | "scraped"
  },
  
  // Testcases
  testcases: [{
    input: String,
    output: String,
    isHidden: Boolean
  }],
  
  // Statistics
  acceptanceRate: Number,
  submissionCount: Number,
  acceptedCount: Number,
  
  // Metadata
  createdBy: ObjectId (admin),
  createdAt: Date,
  updatedAt: Date
}
```

### Submission Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  problemId: ObjectId,
  contestId: ObjectId (optional),
  
  language: String,
  code: String,
  
  verdict: "AC" | "WA" | "TLE" | "RE" | "CE" | "MLE" | "PENDING",
  executionTime: Number (ms),
  memory: Number (MB),
  
  testcaseResults: [{
    testcaseId: ObjectId,
    passed: Boolean,
    output: String,
    expectedOutput: String
  }],
  
  createdAt: Date
}
```

### Contest Collection
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  
  createdBy: ObjectId (host),
  problems: [ObjectId],
  participants: [ObjectId],
  
  startTime: Date,
  endTime: Date,
  duration: Number (minutes),
  
  status: "draft" | "scheduled" | "live" | "ended",
  
  leaderboard: [{
    userId: ObjectId,
    problemsSolved: Number,
    totalTime: Number,
    submissions: Number
  }],
  
  createdAt: Date,
  updatedAt: Date
}
```

---

## 5. API ENDPOINTS

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/profile
```

### Problems
```
GET    /api/problems                    # List all problems
GET    /api/problems/:id                # Get problem details
POST   /api/problems                    # Create problem (admin)
PUT    /api/problems/:id                # Update problem (admin)
DELETE /api/problems/:id                # Delete problem (admin)
GET    /api/problems/:id/submissions    # Get user submissions
```

### Submissions
```
POST   /api/submissions/submit          # Submit code
GET    /api/submissions/:id             # Get submission details
GET    /api/submissions/user            # Get user submissions
GET    /api/submissions/problem/:id     # Get problem submissions
```

### Contests
```
POST   /api/contests                    # Create contest
GET    /api/contests                    # List contests
GET    /api/contests/:id                # Get contest details
POST   /api/contests/:id/join           # Join contest
GET    /api/contests/:id/leaderboard    # Get leaderboard
```

### Admin
```
POST   /api/admin/problems              # Add problem
POST   /api/admin/testcases             # Add testcases
POST   /api/admin/scrape                # Scrape problem
```

---

## 6. DEVELOPMENT PHASES

### Phase 1: Foundation (Weeks 1-2)
- [ ] Setup project structure
- [ ] Database schema and models
- [ ] User authentication (JWT)
- [ ] Basic API endpoints
- [ ] Frontend routing and layout

### Phase 2: Core Features (Weeks 3-4)
- [ ] Problem listing and details
- [ ] Code editor integration
- [ ] Basic code submission
- [ ] Submission history

### Phase 3: Code Evaluation (Weeks 5-6)
- [ ] Docker sandbox setup
- [ ] Code execution pipeline
- [ ] Testcase comparison
- [ ] Verdict generation
- [ ] Queue-based processing (Bull)

### Phase 4: Admin Panel (Weeks 7-8)
- [ ] Admin dashboard
- [ ] Problem management UI
- [ ] Testcase management
- [ ] Reference solution upload

### Phase 5: Web Scraping (Weeks 9-10)
- [ ] Selenium setup
- [ ] LeetCode scraper
- [ ] Codeforces scraper
- [ ] Problem import UI

### Phase 6: Contests (Weeks 11-12)
- [ ] Contest creation
- [ ] Contest management
- [ ] Real-time leaderboard
- [ ] Contest timer

### Phase 7: Real-time Features (Weeks 13-14)
- [ ] Socket.io integration
- [ ] Live leaderboard updates
- [ ] Real-time notifications
- [ ] Participant count tracking

### Phase 8: Production Hardening (Weeks 15-16)
- [ ] Logging and monitoring
- [ ] Error tracking
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Deployment

---

## 7. IMPLEMENTATION DETAILS

### 7.1 Code Execution Pipeline

```
User submits code
    ↓
Express API validates input
    ↓
Create submission record in MongoDB
    ↓
Add job to Bull queue
    ↓
Worker picks up job
    ↓
Download testcases from R2
    ↓
Create Docker container
    ↓
Execute code in sandbox
    ↓
Capture output
    ↓
Compare with expected output
    ↓
Generate verdict
    ↓
Update submission in MongoDB
    ↓
Emit Socket.io event to user
    ↓
User sees result in real-time
```

### 7.2 Docker Sandbox Execution

```typescript
// Execute code in isolated Docker container
const executeCode = async (code, language, testcases) => {
  const docker = new Docker();
  
  // Create container with resource limits
  const container = await docker.createContainer({
    Image: `${language}:latest`,
    Cmd: ['node', '-e', code],
    HostConfig: {
      Memory: 256 * 1024 * 1024,      // 256MB
      MemorySwap: 256 * 1024 * 1024,
      CpuQuota: 50000,                 // 50% CPU
      PidsLimit: 10
    },
    NetworkDisabled: true              // No network access
  });
  
  // Run with timeout
  const result = await Promise.race([
    container.start(),
    timeout(5000)  // 5 second timeout
  ]);
  
  return result;
};
```

### 7.3 Queue-Based Processing

```typescript
// Bull queue for submissions
const submissionQueue = new Queue('submissions', {
  redis: { host: 'localhost', port: 6379 }
});

// Process submissions
submissionQueue.process(async (job) => {
  const { userId, problemId, code, language } = job.data;
  
  // Fetch problem and testcases
  const problem = await Problem.findById(problemId);
  const testcases = await fetchTestcases(problem.testcaseFolder);
  
  // Execute code
  const results = [];
  for (const testcase of testcases) {
    const output = await executeCode(code, language, testcase.input);
    const passed = normalizeOutput(output) === normalizeOutput(testcase.output);
    results.push({ passed, output });
  }
  
  // Determine verdict
  const verdict = results.every(r => r.passed) ? 'AC' : 'WA';
  
  // Update submission
  await Submission.updateOne(
    { _id: job.data.submissionId },
    { verdict, testcaseResults: results }
  );
  
  // Emit real-time update
  io.to(`user-${userId}`).emit('submission-result', { verdict });
  
  return { verdict };
});
```

### 7.4 Web Scraping

```typescript
// Scrape problem from LeetCode
const scrapeLeetCodeProblem = async (problemUrl) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto(problemUrl);
  
  // Extract problem details
  const title = await page.$eval('h1', el => el.textContent);
  const description = await page.$eval('.description', el => el.innerHTML);
  const examples = await page.$$eval('.example', els => 
    els.map(el => ({
      input: el.querySelector('pre').textContent,
      output: el.querySelector('pre:nth-of-type(2)').textContent
    }))
  );
  
  await browser.close();
  
  return { title, description, examples };
};
```

---

## 8. FRONTEND STRUCTURE

```
frontend/src/
├── components/
│   ├── CodeEditor.tsx
│   ├── ProblemViewer.tsx
│   ├── SubmissionResult.tsx
│   ├── Leaderboard.tsx
│   ├── ContestTimer.tsx
│   ├── AdminPanel.tsx
│   └── ...
├── pages/
│   ├── ProblemsPage.tsx
│   ├── ProblemDetailPage.tsx
│   ├── ContestPage.tsx
│   ├── AdminPage.tsx
│   ├── LeaderboardPage.tsx
│   └── ...
├── hooks/
│   ├── useSubmission.ts
│   ├── useProblems.ts
│   ├── useContest.ts
│   └── ...
├── store/
│   ├── authStore.ts
│   ├── problemStore.ts
│   ├── contestStore.ts
│   └── ...
├── services/
│   ├── api.ts
│   ├── socket.ts
│   ├── scraper.ts
│   └── ...
└── App.tsx
```

---

## 9. BACKEND STRUCTURE

```
backend/
├── controllers/
│   ├── authController.ts
│   ├── problemController.ts
│   ├── submissionController.ts
│   ├── contestController.ts
│   ├── adminController.ts
│   └── ...
├── models/
│   ├── User.ts
│   ├── Problem.ts
│   ├── Submission.ts
│   ├── Contest.ts
│   └── ...
├── routes/
│   ├── authRoutes.ts
│   ├── problemRoutes.ts
│   ├── submissionRoutes.ts
│   ├── contestRoutes.ts
│   ├── adminRoutes.ts
│   └── ...
├── services/
│   ├── codeExecutionService.ts
│   ├── scrapingService.ts
│   ├── leaderboardService.ts
│   ├── emailService.ts
│   └── ...
├── queue/
│   ├── submissionQueue.ts
│   ├── workers/
│   │   └── submissionWorker.ts
│   └── ...
├── middleware/
│   ├── auth.ts
│   ├── errorHandler.ts
│   ├── validation.ts
│   └── ...
├── config/
│   ├── database.ts
│   ├── redis.ts
│   ├── docker.ts
│   └── ...
├── utils/
│   ├── logger.ts
│   ├── validators.ts
│   ├── helpers.ts
│   └── ...
└── server.ts
```

---

## 10. DEPLOYMENT ARCHITECTURE

```
┌─────────────────────────────────────────────────────────┐
│                    Users                                │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────▼────────────┐
        │   Vercel (Frontend)     │
        │   React 18 + Vite       │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────────────────┐
        │   Render (Backend)                  │
        │   Express + Node.js                 │
        │   - REST API                        │
        │   - Socket.io                       │
        │   - Authentication                  │
        └────────────┬───────────────────────┬┘
                     │                       │
        ┌────────────▼──────────┐  ┌────────▼──────────┐
        │  MongoDB Atlas        │  │  Upstash Redis    │
        │  (Database)           │  │  (Queue + Cache)  │
        └───────────────────────┘  └────────┬──────────┘
                                            │
                                ┌───────────▼──────────┐
                                │  Bull Workers        │
                                │  (Code Execution)    │
                                └───────────┬──────────┘
                                            │
                                ┌───────────▼──────────┐
                                │  Docker Sandbox      │
                                │  (Code Execution)    │
                                └──────────────────────┘

        ┌──────────────────────────────────────┐
        │  Cloudflare R2                       │
        │  (Testcase Storage)                  │
        └──────────────────────────────────────┘
```

---

## 11. SECURITY CONSIDERATIONS

### Authentication & Authorization
- JWT tokens with expiration
- Refresh token rotation
- Role-based access control (RBAC)
- Rate limiting on API endpoints

### Code Execution Security
- Docker container isolation
- Network disabled
- Memory limits (256MB)
- CPU limits (50%)
- Process limits (10)
- Read-only filesystem
- Timeout (5 seconds)

### Data Protection
- Password hashing with bcrypt
- HTTPS/TLS encryption
- CORS configuration
- Input validation and sanitization
- SQL injection prevention (Mongoose)
- XSS prevention

### Infrastructure Security
- Environment variables for secrets
- Helmet middleware for security headers
- CSRF protection
- Rate limiting
- DDoS protection (Cloudflare)

---

## 12. MONITORING & LOGGING

### Logging
- Winston logger for application logs
- Separate error and combined logs
- Log rotation
- Structured logging (JSON format)

### Monitoring
- Prometheus metrics
- Grafana dashboards
- Error tracking (Sentry)
- Performance monitoring
- Uptime monitoring

### Alerts
- High error rate alerts
- Slow API response alerts
- Queue backlog alerts
- Database connection alerts
- Memory usage alerts

---

## 13. PERFORMANCE OPTIMIZATION

### Caching
- Redis caching for problems
- Leaderboard caching
- User profile caching
- Cache invalidation strategy

### Database Optimization
- Indexes on frequently queried fields
- Query optimization
- Connection pooling
- Read replicas for scaling

### Frontend Optimization
- Code splitting
- Lazy loading
- Image optimization
- CSS/JS minification
- CDN for static assets

### Backend Optimization
- Response compression
- API pagination
- Query optimization
- Connection pooling
- Worker scaling

---

## 14. TESTING STRATEGY

### Unit Tests
- Controller tests
- Service tests
- Utility function tests
- Jest framework

### Integration Tests
- API endpoint tests
- Database tests
- Queue tests
- Supertest framework

### E2E Tests
- User workflows
- Contest scenarios
- Admin operations
- Cypress framework

### Performance Tests
- Load testing (200+ concurrent users)
- Stress testing
- Spike testing
- k6 framework

---

## 15. DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] All tests passing
- [ ] Code review completed
- [ ] Security audit done
- [ ] Performance tested
- [ ] Documentation updated
- [ ] Environment variables configured
- [ ] Database backups configured
- [ ] Monitoring setup

### Deployment
- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Render
- [ ] Database migrations run
- [ ] Redis cache warmed
- [ ] Health checks passing
- [ ] Smoke tests passing

### Post-Deployment
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify all features working
- [ ] User feedback collection
- [ ] Rollback plan ready

---

## 16. NEXT STEPS

1. **Review this document** - Understand the complete architecture
2. **Setup project structure** - Create folders and files
3. **Configure databases** - MongoDB Atlas and Redis
4. **Implement Phase 1** - Foundation and authentication
5. **Implement Phase 2** - Core features
6. **Continue phases** - Follow the development roadmap
7. **Deploy** - Follow deployment checklist

---

## 17. RESOURCES & REFERENCES

### Documentation
- Express.js: https://expressjs.com
- React: https://react.dev
- MongoDB: https://docs.mongodb.com
- Docker: https://docs.docker.com
- Socket.io: https://socket.io/docs

### Libraries
- Bull: https://github.com/OptimalBits/bull
- Mongoose: https://mongoosejs.com
- Puppeteer: https://pptr.dev
- Docker SDK: https://github.com/apocas/dockerode

### Deployment
- Vercel: https://vercel.com/docs
- Render: https://render.com/docs
- MongoDB Atlas: https://docs.atlas.mongodb.com
- Upstash: https://upstash.com/docs

---

**This document is your complete development guide. Follow it phase by phase to build a production-ready competitive programming platform.**

