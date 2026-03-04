# DevFlow Frontend Architecture & Development Guide

Author: Khetesh Deore

Framework: React\
Editor: Monaco Editor\
Deployment: Vercel

This document describes the **complete frontend architecture for
DevFlow**, including:

-   Pages required
-   Page responsibilities
-   Navigation flow
-   Component structure
-   State management
-   API interaction

This document is designed so development can proceed **systematically
without confusion**.

------------------------------------------------------------------------

# 1. Frontend Architecture Overview

Frontend responsibilities:

-   User authentication
-   Contest discovery
-   Problem viewing
-   Code editor interaction
-   Submissions
-   Leaderboard display
-   Real-time updates

Architecture:

    React App
       |
       |---- Pages
       |---- Components
       |---- Services
       |---- Global State

------------------------------------------------------------------------

# 2. Pages Overview

DevFlow frontend should contain the following main pages:

    1. Landing Page
    2. Login Page
    3. Register Page
    4. Dashboard
    5. Contest Details Page
    6. Contest Arena Page
    7. Problem View Panel
    8. Leaderboard Page
    9. Submission History Page
    10. Host Contest Creation Page

------------------------------------------------------------------------

# 3. Page Navigation Flow

User flow:

    Landing Page
          |
    Login / Register
          |
    Dashboard
          |
    Contest List
          |
    Contest Details
          |
    Enter Contest
          |
    Contest Arena
          |
    Submit Code
          |
    Leaderboard

------------------------------------------------------------------------

# 4. Landing Page

Route:

    /

Purpose:

-   Introduce platform
-   Provide login/register buttons

Content:

-   DevFlow logo
-   Description
-   "Start Coding" button
-   Login button
-   Register button

Components:

    Navbar
    HeroSection
    FeatureSection
    Footer

------------------------------------------------------------------------

# 5. Login Page

Route:

    /login

Content:

    Email input
    Password input
    Login button
    Forgot password link

API call:

    POST /api/auth/login

After success:

    redirect → /dashboard

------------------------------------------------------------------------

# 6. Register Page

Route:

    /register

Content:

    Username
    Email
    Password
    Confirm password
    Register button

API:

    POST /api/auth/register

Redirect:

    /dashboard

------------------------------------------------------------------------

# 7. Dashboard Page

Route:

    /dashboard

Purpose:

Main hub for users.

Content:

    Upcoming contests
    Active contests
    Past contests

Components:

    Navbar
    ContestCard
    Sidebar

User actions:

    View contest
    Join contest

------------------------------------------------------------------------

# 8. Contest Details Page

Route:

    /contest/:contestId

Content:

    Contest title
    Contest description
    Start time
    Duration
    Problem list preview
    Join contest button

API:

    GET /api/contests/:id

Action:

    Enter contest

------------------------------------------------------------------------

# 9. Contest Arena Page

Route:

    /contest/:contestId/arena

This is the **most important page**.

Layout:

    -------------------------------------
    | Problem List | Problem Description |
    |              |---------------------|
    |              | Code Editor         |
    -------------------------------------
    | Submission Output Panel            |
    -------------------------------------

Components:

    ContestTimer
    ProblemList
    ProblemViewer
    CodeEditor
    SubmissionPanel

------------------------------------------------------------------------

# 10. Problem Viewer

Shows:

    Problem title
    Description
    Constraints
    Sample input
    Sample output

Component:

    ProblemViewer.jsx

------------------------------------------------------------------------

# 11. Code Editor

Editor:

    Monaco Editor

Features:

    language selection
    syntax highlighting
    run code
    submit code

Buttons:

    Run
    Submit

API:

Run:

    POST /sandbox/run

Submit:

    POST /api/submissions/submit

------------------------------------------------------------------------

# 12. Submission Panel

Displays:

    Verdict
    Execution time
    Memory usage
    Testcase results

Example:

    Accepted
    Runtime: 35ms
    Memory: 12MB

------------------------------------------------------------------------

# 13. Leaderboard Page

Route:

    /contest/:contestId/leaderboard

Content:

Table:

    Rank
    User
    Problems solved
    Score
    Penalty

Updates:

    WebSocket / polling

------------------------------------------------------------------------

# 14. Submission History Page

Route:

    /submissions

Content:

Table:

    Problem
    Verdict
    Language
    Execution time
    Submission time

API:

    GET /api/submissions/user

------------------------------------------------------------------------

# 15. Host Contest Creation Page

Route:

    /host/create-contest

Steps:

Step 1

    Contest title
    Contest description
    Start time
    Duration

Step 2

Add problems:

    Paste problem URL
    Preview problem

Step 3

Reference solution:

    Manual solution
    AI generated solution

Step 4

Generate testcases

Step 5

Publish contest

------------------------------------------------------------------------

# 16. Core Components

Components folder:

    components/

    Navbar
    Footer
    ContestCard
    ProblemViewer
    CodeEditor
    ContestTimer
    LeaderboardTable
    SubmissionTable

------------------------------------------------------------------------

# 17. State Management

Recommended:

    Redux Toolkit

or

    Zustand

Global states:

    User state
    Contest state
    Submission state
    Leaderboard state

------------------------------------------------------------------------

# 18. API Service Layer

Create:

    services/api.js

Functions:

    login()
    register()
    getContests()
    getContestDetails()
    submitCode()
    getLeaderboard()

------------------------------------------------------------------------

# 19. Socket Integration

File:

    services/socket.js

Used for:

    live leaderboard
    submission updates
    contest start notifications

------------------------------------------------------------------------

# 20. Frontend Folder Structure

    client/src

    pages/
    components/
    services/
    store/
    utils/
    assets/

Example:

    pages/
      Dashboard.jsx
      ContestArena.jsx
      Leaderboard.jsx

    components/
      CodeEditor.jsx
      ProblemViewer.jsx

------------------------------------------------------------------------

# 21. Recommended Development Order

Build frontend in this order:

1.  Authentication pages
2.  Dashboard
3.  Contest details page
4.  Contest arena
5.  Code editor
6.  Submission panel
7.  Leaderboard
8.  Host contest page

------------------------------------------------------------------------

# 22. Final Summary

The DevFlow frontend is structured to provide:

-   smooth contest navigation
-   powerful code editor interface
-   real-time leaderboard updates
-   simple contest hosting interface

Pages:

    ~10 pages

This structure allows the platform to support **200 concurrent
participants efficiently**.
