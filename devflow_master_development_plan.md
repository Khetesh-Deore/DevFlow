# DevFlow -- Complete Development Roadmap & Architecture

Author: Khetesh Deore

This document combines the **entire DevFlow system design** into a
**single phase‑wise development workflow**.

Goal: Build a **college competitive programming platform** capable of
supporting **\~200 concurrent participants**.

This document includes:

• Full system architecture\
• Frontend structure\
• Backend structure\
• Problem import system\
• Testcase generation system\
• Cloudflare R2 storage\
• Submission judging pipeline\
• Queue + worker architecture\
• Phase‑wise development plan

This document is meant to be used as a **coding roadmap** while building
DevFlow.

------------------------------------------------------------------------

# 1. System Overview

DevFlow is a **coding contest platform** where:

Hosts can: - Import problems from coding platforms - Provide a reference
solution (manual or AI) - Automatically generate testcases - Create and
schedule contests

Participants can: - Join contests - Solve problems - Submit code - View
leaderboard in real time

The system is optimized for **200 simultaneous students**.

------------------------------------------------------------------------

# 2. High Level Architecture

    Frontend (React + Vercel)
            |
            | REST API / WebSocket
            |
    Backend (Node.js + Express on Render)
            |
            |----------------------
            | MongoDB Atlas
            | Problem metadata
            |
            |----------------------
            | Redis (Upstash)
            | Submission Queue
            |
            |----------------------
            | Cloudflare R2
            | Testcase files
            |
            |----------------------
            | Docker Sandbox
            | Code execution

------------------------------------------------------------------------

# 3. Major System Modules

The platform is divided into the following major modules:

1.  Authentication System
2.  Problem Import System
3.  Reference Solution System
4.  Testcase Generator
5.  Contest Management
6.  Submission Judging System
7.  Leaderboard System
8.  Frontend Contest Interface

------------------------------------------------------------------------

# 4. Phase‑Wise Development Plan

Development should be done **phase by phase**.

------------------------------------------------------------------------

# Phase 1 -- Project Setup

Goal: Prepare development environment and repository.

Tasks:

Create project repository

    devflow/
    client/
    server/
    workers/
    sandbox/
    docs/

Setup frontend project

React application

Setup backend project

Node.js + Express

Setup database connection

MongoDB Atlas

Setup environment configuration

Environment variables

Setup Redis connection

Upstash Redis

Setup Cloudflare R2 credentials

Setup Docker environment

This phase prepares the **base infrastructure**.

------------------------------------------------------------------------

# Phase 2 -- Authentication System

Goal: Build user management.

Backend:

Create user schema

Fields:

username\
email\
passwordHash\
role (host / participant)

Create authentication APIs

Register user\
Login user\
Fetch user profile

Frontend:

Create pages

Login page\
Register page

Flow:

User registers\
User logs in\
User redirected to dashboard

------------------------------------------------------------------------

# Phase 3 -- Dashboard & Contest Discovery

Goal: Allow users to see contests.

Backend:

Create contest schema

Fields:

title\
description\
startTime\
endTime\
duration\
problems\
participants\
status

Create contest APIs

Create contest\
Get contest list\
Get contest details\
Join contest

Frontend:

Create dashboard page

Display:

Upcoming contests\
Active contests\
Past contests

Create contest card component

User actions:

View contest\
Join contest

------------------------------------------------------------------------

# Phase 4 -- Problem Import System

Goal: Allow hosts to import coding problems.

Host workflow:

Host pastes problem URL

Supported platforms:

LeetCode\
Codeforces\
GeeksforGeeks\
HackerRank

Backend process:

Run scraper

Extract:

Problem title\
Description\
Constraints\
Sample inputs\
Sample outputs

Normalize problem format.

Store metadata in MongoDB.

Preview problem on frontend.

------------------------------------------------------------------------

# Phase 5 -- Reference Solution System

Goal: Provide correct solution for testcase generation.

Host chooses solution method:

Option 1:

Manual solution

Host writes solution in editor.

Option 2:

AI generated solution

Backend sends problem description to AI.

AI returns code.

Host can review and edit solution.

Backend stores solution.

Solution schema:

language\
code\
source (manual / ai)

Before continuing:

Validate solution.

Validation process:

Compile solution.

Run sample testcases.

Verify outputs match expected results.

If validation fails:

Reject solution.

Host must correct it.

------------------------------------------------------------------------

# Phase 6 -- Automatic Testcase Generation

Goal: Generate hidden testcases.

Types of tests:

Sample tests

Extracted from problem statement.

Edge tests

Examples:

Minimum input\
Maximum input\
Empty input\
Duplicate values

Random stress tests

Large randomized inputs based on constraints.

Testcase generator service:

Steps:

Detect problem type

Possible types:

Array problems\
String problems\
Graph problems\
Math problems

Generate inputs.

Examples:

Edge cases

Random inputs

Inputs saved temporarily.

------------------------------------------------------------------------

# Phase 7 -- Automatic Output Generation

Goal: Generate correct outputs.

For every generated input:

Run reference solution in sandbox.

Pipeline:

    Input testcase
          |
    Run reference solution
          |
    Capture output
          |
    Save output file

Example files:

    input1.txt
    output1.txt

    input2.txt
    output2.txt

------------------------------------------------------------------------

# Phase 8 -- Testcase Storage

Testcases must not be stored in MongoDB.

Instead use **Cloudflare R2**.

Create bucket

Example:

    devflow-testcases

Folder structure:

    problem_123
       |
       | inputs
       |    1.txt
       |    2.txt
       |
       | outputs
            1.txt
            2.txt

MongoDB stores metadata only.

Example:

folder path

number of testcases

------------------------------------------------------------------------

# Phase 9 -- Contest Creation System

Host creates contest.

Steps:

Enter contest title.

Enter description.

Select problems.

Set start time.

Set contest duration.

Publish contest.

Contest states:

draft\
scheduled\
live\
ended

Cron job monitors contest start and end.

------------------------------------------------------------------------

# Phase 10 -- Contest Arena Frontend

This is the most important UI.

Layout:

    Problem List | Problem Description
                 | Code Editor
    ----------------------------------
    Submission Results

Components:

Problem viewer

Displays:

Title\
Description\
Constraints\
Examples

Code editor

Monaco Editor

Features:

Language selection\
Run code\
Submit code

Submission panel

Shows verdicts.

------------------------------------------------------------------------

# Phase 11 -- Run Code Feature

User can test code before submitting.

API:

Run code against sample testcases.

Sandbox executes code.

Display output to user.

------------------------------------------------------------------------

# Phase 12 -- Submission System

User clicks submit.

Backend flow:

Create submission record.

Add job to submission queue.

Queue name:

submissionQueue

Submission schema includes:

userId\
contestId\
problemId\
language\
code

------------------------------------------------------------------------

# Phase 13 -- Queue & Worker System

Queue uses:

Redis + BullMQ.

Purpose:

Handle multiple submissions safely.

Flow:

Submission received.

Job added to queue.

Worker processes job.

------------------------------------------------------------------------

# Phase 14 -- Worker Execution Pipeline

Worker receives submission job.

Steps:

Fetch problem metadata.

Download testcases from R2.

Run sandbox execution.

Compare outputs.

Generate verdict.

Update submission.

------------------------------------------------------------------------

# Phase 15 -- Sandbox Code Execution

User code runs in Docker container.

Security restrictions:

No network access

Memory limits

CPU limits

Process limits

Read‑only filesystem

Languages supported:

C\
C++\
Java\
Python\
JavaScript

------------------------------------------------------------------------

# Phase 16 -- Output Comparison

Before comparison normalize output.

Steps:

Trim whitespace.

Normalize newline characters.

Compare expected vs actual.

Possible verdicts:

Accepted\
Wrong Answer\
Time Limit Exceeded\
Runtime Error\
Compilation Error\
Memory Limit Exceeded

------------------------------------------------------------------------

# Phase 17 -- Leaderboard System

Leaderboard ranks participants.

Ranking factors:

Problems solved

Penalty time

Leaderboard stored in Redis sorted set.

Frontend updates via WebSocket.

------------------------------------------------------------------------

# Phase 18 -- Scaling Strategy

Contest scenario:

200 participants

Average submissions per user:

5

Total submissions:

\~1000

Queue ensures submissions are processed safely.

Worker setup:

3 sandbox workers

Each worker processes jobs sequentially.

------------------------------------------------------------------------

# Phase 19 -- Frontend Pages

Frontend contains following pages:

Landing Page

Login Page

Register Page

Dashboard

Contest Details

Contest Arena

Leaderboard

Submission History

Host Contest Creation

Navigation flow:

Landing → Login → Dashboard → Contest → Arena

------------------------------------------------------------------------

# Phase 20 -- Recommended Development Order

Follow this order strictly.

1.  Project setup

2.  Authentication system

3.  Dashboard and contest listing

4.  Problem import system

5.  Reference solution system

6.  Testcase generator

7.  Output generator

8.  Cloudflare R2 storage integration

9.  Contest creation

10. Contest arena frontend

11. Run code feature

12. Submission queue

13. Worker judging system

14. Leaderboard

15. Real‑time updates

------------------------------------------------------------------------

# Final Summary

DevFlow architecture provides:

Automated problem import

Automatic testcase generation

Secure sandbox execution

Scalable submission judging

Real‑time contest experience

The system is designed to support:

    ~200 concurrent participants

on affordable infrastructure.

This document should serve as the **primary development roadmap for
implementing DevFlow**.
