# DevFlow Backend Setup Guide

## Phase 2 Implementation Complete ✅

### What's Been Implemented

#### 1. **Authentication System**
- User registration with email/username
- Login with JWT tokens
- Password hashing with bcrypt
- Protected routes middleware
- Role-based authorization (admin/participant)
- Profile management
- Password change functionality

#### 2. **Database Models**
- **User Model**: Complete user management with stats and profile
- **Problem Model**: Problem storage with test cases and metadata
- **Contest Model**: Full contest management with participants and settings
- **Submission Model**: Track all code submissions with results
- **Violation Model**: Anti-cheat violation tracking

#### 3. **Server Infrastructure**
- Socket.io integration for real-time features
- Security middleware (helmet, rate limiting)
- CORS configuration
- Error handling
- Graceful shutdown

## Installation Steps

### 1. Install Dependencies

```bash
cd backend
npm install
```

This will install all required packages:
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication
- `cookie-parser` - Cookie handling
- `slugify` - URL slug generation
- `bull` - Job queue for submissions
- `node-cron` - Contest scheduling
- `socket.io` - Real-time communication
- `redis` - Caching and queue
- `express-rate-limit` - API rate limiting
- `helmet` - Security headers
- `compression` - Response compression

### 2. Environment Configuration

Your `.env` file has been updated with:

```env
# JWT Configuration
JWT_SECRET=devflow-super-secret-jwt-key-2024-change-in-production
JWT_EXPIRE=7d

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Client URL (for CORS)
CLIENT_URL=http://localhost:3000
```

**⚠️ IMPORTANT**: Change `JWT_SECRET` in production!

### 3. Start MongoDB

Make sure MongoDB is running:

```bash
# Windows
mongod

# Linux/Mac
sudo systemctl start mongod
```

### 4. Start Redis (Optional for now, required for Phase 6)

```bash
# Windows (if installed)
redis-server

# Linux/Mac
sudo systemctl start redis
```

### 5. Start the Server

```bash
npm run dev
```

You should see:
```
✓ Server running on port 5000
✓ Environment: development
✓ MongoDB: mongodb://localhost:27017/devflow
MongoDB Connected
```

## API Endpoints

### Authentication Routes

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "role": "participant"  // optional, defaults to "participant"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "participant",
    "profile": {...},
    "stats": {...}
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "newusername",
  "bio": "I love competitive programming",
  "country": "USA",
  "avatar": "https://example.com/avatar.jpg"
}
```

#### Change Password
```http
PUT /api/auth/password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

## Testing the Authentication

### Using cURL

#### 1. Register a new user:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"testuser\",\"email\":\"test@example.com\",\"password\":\"test123\"}"
```

#### 2. Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"test123\"}"
```

Copy the token from the response.

#### 3. Get user profile:
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Postman or Thunder Client

1. Create a new request collection
2. Set up environment variable for `token`
3. Test all endpoints above
4. Token is automatically included in protected routes

## Database Structure

### Users Collection
```javascript
{
  _id: ObjectId,
  username: "johndoe",
  email: "john@example.com",
  password: "$2a$10$...", // hashed
  role: "participant",
  profile: {
    avatar: "",
    bio: "",
    rating: 1500,
    country: ""
  },
  stats: {
    contestsParticipated: 0,
    problemsSolved: 0,
    totalSubmissions: 0,
    acceptedSubmissions: 0
  },
  createdAt: ISODate,
  updatedAt: ISODate
}
```

## Security Features

✅ Password hashing with bcrypt (10 rounds)
✅ JWT token authentication
✅ Protected routes middleware
✅ Role-based authorization
✅ Rate limiting (100 requests per 15 minutes in production)
✅ Helmet security headers
✅ CORS configuration
✅ Input validation
✅ Error handling

## Next Steps

### Phase 3: Contest Management (Next)
- Contest CRUD operations
- Problem import integration
- Contest scheduling with cron jobs

### Phase 4: Code Submission Pipeline
- Integrate sandbox service
- Bull queue for background jobs
- Submission processing

### Phase 5: Anti-Cheat System
- Violation tracking
- Real-time monitoring

### Phase 6: Leaderboard System
- Redis integration
- Real-time rank calculation

### Phase 7: Real-Time Features
- Socket.io event handlers
- Live updates

### Phase 8: Frontend Development
- React application
- Monaco Editor
- Contest arena UI

## Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Start MongoDB service

### JWT Secret Warning
```
Warning: JWT_SECRET not set
```
**Solution**: Check `.env` file has `JWT_SECRET` defined

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution**: Kill process on port 5000 or change PORT in `.env`

### Module Not Found
```
Error: Cannot find module 'bcryptjs'
```
**Solution**: Run `npm install`

## Development Tips

1. **Use nodemon**: Already configured with `npm run dev`
2. **Check logs**: Server logs all authentication attempts
3. **MongoDB Compass**: Use GUI to inspect database
4. **Postman**: Save requests for quick testing
5. **Environment**: Keep development and production `.env` separate

## Support

For issues or questions:
1. Check `TROUBLESHOOTING.txt`
2. Review error logs
3. Verify all services are running
4. Check environment variables

---

**Status**: Phase 2 Complete ✅
**Next**: Phase 3 - Contest Management System
