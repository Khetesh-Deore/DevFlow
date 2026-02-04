# DevFlow

A competitive programming practice platform with integrated code execution sandbox.

## Features

- **Multi-Platform Problem Scraping**: LeetCode, Codeforces, HackerRank, GeeksforGeeks, CodeChef
- **AI-Powered Test Case Generation**: Using Google Gemini
- **Secure Code Execution Sandbox**: Isolated Docker environment
- **Multi-Language Support**: C, C++, Java, Python, JavaScript
- **Contest-Grade Judging**: AC/WA/TLE/RE/CE verdicts
- **MongoDB Storage**: Problem and test case persistence

## Architecture

```
Frontend (Vercel) → Backend API (Render) → Sandbox (Docker)
                          ↓
                    MongoDB Database
```

## Quick Start

### 1. Backend Setup
```bash
cd backend
npm install
cp sample.env .env
# Add your API keys to .env
npm run dev
```

### 2. Sandbox Setup
```bash
cd sandbox
npm install
npm start
```

### 3. Test the System
```bash
cd sandbox
npm test
```

## API Endpoints

### Problems
- `POST /api/problems/create` - Create problem from URL
- `GET /api/problems/:id` - Get problem details
- `POST /api/problems/:id/submit` - Submit solution
- `GET /api/problems` - List all problems

### Sandbox
- `POST /api/sandbox/run` - Execute code directly
- `GET /health` - Sandbox health check

### Scraping
- `POST /api/leetcode/scrape` - Scrape LeetCode
- `POST /api/codeforces/scrape` - Scrape Codeforces
- `POST /api/hackerrank/scrape` - Scrape HackerRank
- `POST /api/gfg/scrape` - Scrape GeeksforGeeks
- `POST /api/codechef/scrape` - Scrape CodeChef

## Sandbox System

The sandbox provides secure, isolated code execution with:
- Resource limits (time, memory, CPU)
- Security controls (no network, read-only filesystem)
- Multi-language support
- Docker isolation

See `sandbox/QUICKSTART.txt` and `sandbox/SANDBOX_GUIDE.txt` for details.

## Environment Variables

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/devflow
GEMINI_API_KEY=your_key
JUDGE0_API_KEY=your_key
SANDBOX_URL=http://localhost:3001
```

## Tech Stack

- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Scraping**: Selenium WebDriver
- **AI**: Google Generative AI (Gemini)
- **Sandbox**: Docker, isolated execution
- **Code Execution**: Judge0 API (fallback), Local sandbox (primary)

## Deployment

### Backend (Render/Railway)
1. Deploy backend with MongoDB connection
2. Set environment variables
3. Ensure sandbox URL is configured

### Sandbox (Docker)
```bash
cd sandbox
npm run docker:build
npm run docker:up
```

## Security

- Forbidden keyword detection
- Code size limits
- Resource quotas
- Process isolation
- No network access in sandbox
- Non-root execution

## License

ISC
