# DevFlow IDE Development Guide

Author: Khetesh Deore

This document explains **how to use an AI‑assisted IDE (Cursor /
Windsurf / Copilot‑style IDE)** to develop the DevFlow platform
efficiently.

Goal: Build DevFlow in a structured way while ensuring the system can
**handle \~200 concurrent participants during contests**.

This file provides:

• Instructions for the IDE while generating code\
• Project build strategy\
• Rules the IDE must follow when generating code\
• Concurrency handling guidelines\
• Testing strategy\
• Performance considerations

The goal is to make the **AI IDE act like a disciplined software
engineer** while writing code.

------------------------------------------------------------------------

# 1. Project Context For IDE

DevFlow is a **competitive programming contest platform**.

Main capabilities:

• Problem scraping\
• Reference solution system\
• Automatic testcase generation\
• Cloudflare R2 testcase storage\
• Contest hosting\
• Code execution sandbox\
• Submission judging\
• Leaderboard system

Target scale:

    200 concurrent participants
    ≈ 1000 submissions during contest

The IDE must generate code with **scalability and safety in mind**.

------------------------------------------------------------------------

# 2. Technology Stack

The IDE must follow this stack strictly.

Frontend:

    React
    Monaco Editor
    Socket.IO
    Vercel deployment

Backend:

    Node.js
    Express.js
    MongoDB Atlas
    Redis (Upstash)
    BullMQ

Execution:

    Docker sandbox

Storage:

    Cloudflare R2

------------------------------------------------------------------------

# 3. Monorepo Structure

IDE must maintain this structure.

    devflow/

    client/
    server/
    workers/
    sandbox/
    docs/

Rules:

• Frontend code only inside **client**\
• Backend code only inside **server**\
• Worker processes inside **workers**\
• Sandbox execution inside **sandbox**

------------------------------------------------------------------------

# 4. Coding Rules For IDE

The IDE should follow these rules while generating code.

Rule 1

Each module must be independent.

Example:

    problemService
    contestService
    submissionService

------------------------------------------------------------------------

Rule 2

Controllers should remain thin.

Logic should go inside **services**.

Example:

    controller → validate request
    service → business logic

------------------------------------------------------------------------

Rule 3

Database queries must be optimized.

Use indexes for:

    problemId
    contestId
    userId

------------------------------------------------------------------------

Rule 4

Never store large testcases inside MongoDB.

Store them in:

    Cloudflare R2

MongoDB only stores metadata.

------------------------------------------------------------------------

# 5. Backend Performance Rules

The IDE must follow these constraints.

Maximum concurrent users:

    200

Expected submissions:

    ~1000 per contest

To support this:

Submissions must be processed through **queue workers**.

Never process submission directly in API route.

Correct architecture:

    API
     ↓
    Queue
     ↓
    Worker
     ↓
    Sandbox

------------------------------------------------------------------------

# 6. Queue Architecture

Use:

    Redis + BullMQ

Queue name:

    submissionQueue

Flow:

    User submits code
            ↓
    API creates submission record
            ↓
    Job added to queue
            ↓
    Worker executes job

------------------------------------------------------------------------

# 7. Worker Design Rules

Workers must:

• run independently from API server\
• process jobs sequentially\
• isolate sandbox execution

Recommended setup:

    3 workers

Each worker processes jobs one at a time.

This safely handles:

    ~1000 submissions

------------------------------------------------------------------------

# 8. Sandbox Execution Rules

User code must run inside Docker container.

Security restrictions:

• No internet access\
• Memory limit\
• CPU limit\
• Process limit\
• Read‑only filesystem

Example limits:

    Memory: 256MB
    Time limit: 2 seconds

------------------------------------------------------------------------

# 9. Testcase Storage Rules

Testcases stored in Cloudflare R2.

Structure:

    problem_101/

    inputs/
    1.txt
    2.txt

    outputs/
    1.txt
    2.txt

Worker must download testcases before execution.

IDE should implement **local caching** of testcases to reduce repeated
downloads.

------------------------------------------------------------------------

# 10. Testcase Generation Rules

IDE should implement generators for:

• array problems\
• string problems\
• graph problems

Each problem should have:

    10‑20 testcases

Categories:

• sample tests\
• edge cases\
• random stress tests

Outputs generated using reference solution.

------------------------------------------------------------------------

# 11. Frontend Performance Rules

Frontend must avoid excessive API calls.

Use:

    WebSocket updates

For:

• leaderboard updates\
• submission status\
• contest start notification

------------------------------------------------------------------------

# 12. Code Editor Requirements

Editor:

    Monaco Editor

Features required:

• language selection\
• syntax highlighting\
• run code\
• submit code

Run code executes sample tests only.

------------------------------------------------------------------------

# 13. API Performance Rules

The IDE must ensure APIs remain lightweight.

Rules:

API must not execute heavy operations.

Example:

Bad design

    submit → run code immediately

Correct design

    submit → push job to queue

------------------------------------------------------------------------

# 14. Caching Strategy

Use caching for:

• testcases • leaderboard • contest metadata

Use Redis where possible.

------------------------------------------------------------------------

# 15. Error Handling Rules

All backend modules must include:

• try/catch blocks\
• structured error responses\
• logging

Workers must retry failed jobs.

------------------------------------------------------------------------

# 16. Logging Strategy

Workers should log:

• submission ID\
• execution time\
• verdict

Logs help debug judging issues.

------------------------------------------------------------------------

# 17. Testing Strategy

IDE must generate tests for:

Backend

• API routes\
• services\
• worker logic

Frontend

• page rendering\
• contest flow

------------------------------------------------------------------------

# 18. Stress Testing Plan

Before deployment simulate:

    200 users

Tools:

    k6
    Artillery

Test:

• submission endpoint\
• queue processing\
• sandbox execution

------------------------------------------------------------------------

# 19. Deployment Rules

Frontend:

    Vercel

Backend:

    Render

Queue:

    Upstash Redis

Storage:

    Cloudflare R2

Execution:

    Docker sandbox

------------------------------------------------------------------------

# 20. Development Workflow With IDE

Recommended workflow:

Step 1

Generate backend models.

Step 2

Generate service layer.

Step 3

Generate controllers.

Step 4

Generate APIs.

Step 5

Build queue system.

Step 6

Build sandbox execution.

Step 7

Build frontend pages.

Step 8

Integrate WebSocket updates.

------------------------------------------------------------------------

# 21. Code Review Checklist For IDE

Before finishing any module ensure:

• no blocking operations in APIs\
• queue used for heavy tasks\
• sandbox isolated execution\
• database indexes present\
• API response times under 200ms

------------------------------------------------------------------------

# 22. Final Development Goal

The IDE should help produce a platform capable of:

    200 concurrent contest participants

with:

• stable submission processing\
• secure code execution\
• reliable leaderboard updates

------------------------------------------------------------------------

# Final Note

This document should be provided to the **AI IDE as project context** so
it generates structured and scalable code while building DevFlow.
