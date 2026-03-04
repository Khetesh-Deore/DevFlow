# DevFlow -- Detailed Development Blueprint

Author: Khetesh Deore

This document contains the **practical development blueprint** for
building DevFlow -- a competitive programming contest platform capable
of handling \~200 concurrent participants.

It includes:

• Complete repository folder structure\
• Backend API design\
• Queue + worker architecture\
• Judge execution pipeline\
• Core backend services

------------------------------------------------------------------------

# 1. Monorepo Structure

Recommended repository layout:

    devflow/
    │
    ├── client/                 # React Frontend (Vercel)
    │
    ├── server/                 # Node.js Backend (Render)
    │
    ├── sandbox/                # Code execution engine
    │
    ├── workers/                # Queue workers
    │
    ├── docs/
    │
    └── docker/

------------------------------------------------------------------------

# 2. Frontend Folder Structure

    client/src

    ├── pages
    │   ├── LoginPage
    │   ├── RegisterPage
    │   ├── Dashboard
    │   ├── ContestPage
    │   ├── LeaderboardPage
    │
    ├── components
    │   ├── CodeEditor
    │   ├── ProblemViewer
    │   ├── ContestTimer
    │   ├── SubmissionHistory
    │   ├── Navbar
    │
    ├── services
    │   ├── api.js
    │   ├── socket.js
    │
    ├── store
    │   ├── authStore
    │   ├── contestStore
    │
    └── utils

Editor library:

    Monaco Editor

------------------------------------------------------------------------

# 3. Backend Folder Structure

    server/

    ├── controllers
    │   ├── authController.js
    │   ├── problemController.js
    │   ├── contestController.js
    │   ├── submissionController.js
    │
    ├── models
    │   ├── User.js
    │   ├── Problem.js
    │   ├── Contest.js
    │   ├── Submission.js
    │
    ├── routes
    │   ├── authRoutes.js
    │   ├── problemRoutes.js
    │   ├── contestRoutes.js
    │   ├── submissionRoutes.js
    │
    ├── services
    │   ├── scraperService.js
    │   ├── testcaseGeneratorService.js
    │   ├── solutionValidatorService.js
    │   ├── r2StorageService.js
    │   ├── leaderboardService.js
    │
    ├── queue
    │   ├── submissionQueue.js
    │
    ├── config
    │   ├── redis.js
    │   ├── database.js
    │
    └── app.js

------------------------------------------------------------------------

# 4. Worker Folder Structure

    workers/

    └── submissionWorker.js

Worker handles code judging jobs.

------------------------------------------------------------------------

# 5. Sandbox Structure

    sandbox/

    ├── executor.js
    ├── dockerRunner.js
    ├── languages
    │   ├── cpp.js
    │   ├── python.js
    │   ├── java.js
    │   ├── javascript.js

Purpose:

Secure execution of user code.

------------------------------------------------------------------------

# 6. Database Schemas

## User

    User
    {
     username
     email
     passwordHash
     role (host | participant)
     rating
     createdAt
    }

------------------------------------------------------------------------

## Problem

    Problem
    {
     title
     description
     difficulty

     sampleTestCases

     referenceSolution
     {
       language
       code
       source
     }

     testcaseMeta
     {
       folder
       count
     }

     createdAt
    }

------------------------------------------------------------------------

## Contest

    Contest
    {
     title
     description
     startTime
     endTime
     duration

     problems[]

     participants[]

     status
    }

------------------------------------------------------------------------

## Submission

    Submission
    {
     userId
     contestId
     problemId

     language
     code

     verdict
     executionTime
     memory

     createdAt
    }

------------------------------------------------------------------------

# 7. Backend API Design

## Auth APIs

    POST /api/auth/register
    POST /api/auth/login
    GET  /api/auth/profile

------------------------------------------------------------------------

## Problem APIs

    POST /api/problems/import
    GET  /api/problems/:id
    GET  /api/problems

Import flow:

    scrape problem
    host provide solution
    generate testcases
    upload to R2
    store metadata

------------------------------------------------------------------------

## Contest APIs

    POST /api/contests/create
    GET  /api/contests
    GET  /api/contests/:id
    POST /api/contests/:id/join

------------------------------------------------------------------------

## Submission APIs

    POST /api/submissions/submit
    GET  /api/submissions/:id
    GET  /api/submissions/user

------------------------------------------------------------------------

# 8. Testcase Generation Service

Located in:

    services/testcaseGeneratorService.js

Responsibilities:

• detect problem type\
• generate edge cases\
• generate random stress tests

Example generators:

    generateArrayCases()
    generateStringCases()
    generateGraphCases()

------------------------------------------------------------------------

# 9. Reference Solution Validation

Before generating outputs:

    compile solution
    run sample testcases
    verify correctness

If failed → reject solution.

------------------------------------------------------------------------

# 10. Output Generation Pipeline

    generate input testcase
          ↓
    run reference solution in sandbox
          ↓
    capture stdout
          ↓
    save output file

Files stored in:

    Cloudflare R2

------------------------------------------------------------------------

# 11. Testcase Storage Structure

Bucket:

    devflow-testcases

Structure:

    problem_123/
       inputs/
           1.txt
           2.txt

       outputs/
           1.txt
           2.txt

------------------------------------------------------------------------

# 12. Queue Architecture

Queue system:

    Redis + BullMQ

Queue name:

    submissionQueue

Flow:

    submission request
         ↓
    add job to queue
         ↓
    worker picks job
         ↓
    judge execution

------------------------------------------------------------------------

# 13. Worker Architecture

Worker process:

    receive submission job
          ↓
    download testcases
          ↓
    execute sandbox
          ↓
    compare outputs
          ↓
    update database

------------------------------------------------------------------------

# 14. Judge Execution Flow

Full pipeline:

    User submits code
          ↓
    Submission stored in DB
          ↓
    Job added to queue
          ↓
    Worker fetches testcases
          ↓
    Docker sandbox executes code
          ↓
    Compare outputs
          ↓
    Generate verdict
          ↓
    Update leaderboard

------------------------------------------------------------------------

# 15. Output Comparison

Normalize outputs before comparison:

    trim whitespace
    normalize newline

------------------------------------------------------------------------

# 16. Verdict Types

    AC
    WA
    TLE
    RE
    CE
    MLE

------------------------------------------------------------------------

# 17. Leaderboard Service

Located in:

    services/leaderboardService.js

Leaderboard ranking based on:

1.  Problems solved
2.  Total time

Stored in:

    Redis sorted set

------------------------------------------------------------------------

# 18. Scaling Strategy (200 Participants)

Typical contest metrics:

    200 participants
    5 submissions average
    ≈1000 submissions

Queue handles safely.

Workers:

    3 sandbox workers

Each worker processes jobs sequentially.

------------------------------------------------------------------------

# 19. Deployment Stack

Frontend:

    Vercel

Backend:

    Render

Database:

    MongoDB Atlas

Queue:

    Upstash Redis

Storage:

    Cloudflare R2

Execution:

    Docker sandbox

------------------------------------------------------------------------

# 20. Development Order

Recommended build order:

1.  Authentication system
2.  Problem scraper integration
3.  Reference solution system
4.  Testcase generator
5.  Cloudflare R2 integration
6.  Contest creation
7.  Submission queue
8.  Sandbox execution
9.  Leaderboard
10. Contest UI

------------------------------------------------------------------------

# 21. Final Summary

DevFlow architecture enables:

• scalable contest platform\
• automated testcase generation\
• secure code execution\
• efficient storage\
• real-time leaderboard

Designed to support:

    ~200 concurrent participants

on low‑cost infrastructure.
