# DevFlow -- Complete Technical Workflow & Architecture (MVP for \~200 Concurrent Participants)

Author: Khetesh Deore\
Stack: MERN + Docker Sandbox + Redis Queue + Cloudflare R2\
Target Scale: \~200 simultaneous participants

------------------------------------------------------------------------

# 1. System Overview

DevFlow is a **college coding contest platform** that allows:

-   Hosts to create contests
-   Import problems from platforms (LeetCode, Codeforces, GFG,
    HackerRank)
-   Automatically generate testcases
-   Run submissions in a secure sandbox
-   Maintain real-time leaderboard

The system is designed to **support \~200 concurrent participants**
during contests.

------------------------------------------------------------------------

# 2. High Level Architecture

    React Frontend (Vercel)
            |
            | REST API + WebSocket
            v
    Node.js Backend API (Render)
            |
            |---- MongoDB Atlas (metadata)
            |
            |---- Redis (Upstash)
            |        |
            |        |---- Submission Queue (BullMQ)
            |
            |---- Sandbox Worker (Docker)
            |
            |---- Cloudflare R2
                     |
                     |---- testcase files

------------------------------------------------------------------------

# 3. Core Components

## 3.1 Frontend (React)

Responsibilities:

-   Authentication
-   Contest dashboard
-   Problem viewing
-   Code editor (Monaco Editor)
-   Submission handling
-   Real-time leaderboard updates

Hosting: **Vercel**

------------------------------------------------------------------------

## 3.2 Backend API (Node.js + Express)

Responsibilities:

-   Authentication
-   Problem management
-   Contest scheduling
-   Submission API
-   Testcase generation
-   R2 integration
-   Queue management

Hosting: **Render**

------------------------------------------------------------------------

## 3.3 Database (MongoDB Atlas)

Stores metadata only.

Collections:

-   Users
-   Problems
-   Contests
-   Submissions

Testcase files are NOT stored here.

------------------------------------------------------------------------

## 3.4 Object Storage (Cloudflare R2)

Stores all testcase files.

Example bucket structure:

    devflow-testcases
       |
       |---- problem_101
       |        |
       |        |---- inputs
       |        |       1.txt
       |        |       2.txt
       |
       |        |---- outputs
       |                1.txt
       |                2.txt

------------------------------------------------------------------------

## 3.5 Queue System (Redis + BullMQ)

Used for submission processing.

Reason:

If 200 users submit simultaneously, requests must be queued.

Queue ensures controlled execution.

------------------------------------------------------------------------

## 3.6 Sandbox Worker (Docker)

Responsible for executing user code securely.

Security rules:

-   no internet
-   CPU limits
-   memory limits
-   process limits
-   read-only filesystem

Languages supported:

-   C
-   C++
-   Java
-   Python
-   JavaScript

------------------------------------------------------------------------

# 4. Database Schema Design

## User

    User
    {
      username
      email
      passwordHash
      role (host | participant)
      stats
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
         source (manual | ai)
      }

      testcaseMeta
      {
         provider : "r2"
         folder : "problem_101"
         count : 20
      }
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

     submittedAt
    }

------------------------------------------------------------------------

# 5. Problem Import Workflow

Step 1 -- Host pastes problem URL

Supported platforms:

-   LeetCode
-   Codeforces
-   GFG
-   HackerRank

Step 2 -- Scraper extracts:

-   Title
-   Description
-   Constraints
-   Examples

Step 3 -- Host provides reference solution

Two options:

    1) Manual solution
    2) AI generated solution

Step 4 -- Validate solution

Run sample testcases.

If correct → continue.

------------------------------------------------------------------------

# 6. Testcase Generation Workflow

Goal: Automatically create hidden tests.

Types:

### Sample tests

Extracted from problem.

### Edge tests

Examples:

-   empty input
-   minimum values
-   maximum values
-   duplicates
-   sorted arrays

### Random stress tests

Large random inputs based on constraints.

------------------------------------------------------------------------

## Input Generation

Example:

    generateEdgeCases()
    generateRandomCases()

Inputs generated:

    input1.txt
    input2.txt
    input3.txt
    ...

------------------------------------------------------------------------

## Output Generation

For each input:

    run reference solution
    capture stdout
    save as output file

Example:

    input1.txt
    2 3

    output1.txt
    5

------------------------------------------------------------------------

## Upload Testcases to R2

Folder created:

    problem_101
       inputs
       outputs

Files uploaded.

MongoDB metadata updated.

------------------------------------------------------------------------

# 7. Contest Workflow

Host Flow:

    create contest
    add problems
    set start time
    set duration
    publish contest

Contest states:

    draft
    scheduled
    live
    ended

Cron job monitors contest status.

------------------------------------------------------------------------

# 8. Participant Workflow

Participant:

    register
    join contest
    open problem
    write code
    run sample tests
    submit solution

------------------------------------------------------------------------

# 9. Submission Judging Pipeline

When user submits:

    POST /submit

Backend:

    create submission record
    add job to queue

Worker:

    fetch testcases from R2
    run sandbox execution
    compare outputs
    generate verdict
    update submission
    update leaderboard

------------------------------------------------------------------------

# 10. Output Comparison

Before comparing:

    trim whitespace
    normalize newline

Example:

    expected = "5"
    actual = "5\n"

Result = ACCEPTED

------------------------------------------------------------------------

# 11. Verdict Types

    AC  Accepted
    WA  Wrong Answer
    TLE Time Limit Exceeded
    RE  Runtime Error
    CE  Compilation Error
    MLE Memory Limit Exceeded

------------------------------------------------------------------------

# 12. Leaderboard System

Leaderboard sorted by:

1.  Problems solved
2.  Total time

Stored in Redis sorted set.

Example:

    ZADD leaderboard score userId

Updates broadcast via WebSocket.

------------------------------------------------------------------------

# 13. Scaling for 200 Participants

Typical contest behavior:

-   200 users
-   average 5 submissions per user

Total submissions:

    ~1000 submissions

Queue handles this safely.

Sandbox workers can be scaled.

Example:

    3 workers
    each handles submissions sequentially

------------------------------------------------------------------------

# 14. Deployment Stack

Frontend

    Vercel

Backend

    Render

Database

    MongoDB Atlas

Queue

    Upstash Redis

Testcase Storage

    Cloudflare R2

Execution

    Docker sandbox

------------------------------------------------------------------------

# 15. Recommended Development Order

1.  Authentication system
2.  Problem scraper integration
3.  Reference solution system
4.  Testcase generator
5.  R2 storage integration
6.  Contest creation
7.  Submission queue
8.  Sandbox execution
9.  Leaderboard
10. Contest UI

------------------------------------------------------------------------

# 16. Final Summary

DevFlow architecture ensures:

-   scalable contest platform
-   secure code execution
-   automated testcase generation
-   efficient storage
-   reliable judging system

Designed for:

    ~200 concurrent participants

while remaining deployable on **free/low-cost infrastructure**.
