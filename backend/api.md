I'll give you step-by-step instructions to test the backend through Postman. Let me first check your environment setup and routes.

Read file(s)

.env

sample.env

authRoutes.js

problemRoutes.js

sandboxRoutes.js
Perfect! Here's your complete step-by-step guide to test the backend through Postman:

Step-by-Step Postman Testing Guide
Step 1: Start the Backend Server
cd backend
npm install
npm run dev
The server will run on http://localhost:5000

Step 2: Open Postman
Download and install Postman
Create a new workspace or use the default one
Step 3: Create Environment Variables in Postman
Click Environments (left sidebar)
Click Create New Environment
Name it DevFlow Local
Add these variables:
base_url: http://localhost:5000
token: (leave empty for now)
Click Save
Select this environment from the dropdown (top-right)
API Endpoints to Test
1. Authentication Endpoints
Register a New User

Method: POST
URL: {{base_url}}/api/auth/register
Body (JSON):
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Password123!",
  "role": "user"
}
Login

Method: POST
URL: {{base_url}}/api/auth/login
Body (JSON):
{
  "email": "test@example.com",
  "password": "Password123!"
}
After login: Copy the token from response and paste it in your Postman environment variable token
Get Current User

Method: GET
URL: {{base_url}}/api/auth/me
Headers:
Authorization: Bearer {{token}}
Update Profile

Method: PUT
URL: {{base_url}}/api/auth/profile
Headers:
Authorization: Bearer {{token}}
Body (JSON):
{
  "username": "newusername",
  "bio": "I love competitive programming"
}
Change Password

Method: PUT
URL: {{base_url}}/api/auth/password
Headers:
Authorization: Bearer {{token}}
Body (JSON):
{
  "currentPassword": "Password123!",
  "newPassword": "NewPassword456!"
}
2. Sandbox/Code Execution Endpoints
Run Code

Method: POST
URL: {{base_url}}/api/sandbox/run
Body (JSON):
{
  "code": "console.log('Hello World');",
  "language": "javascript",
  "testCases": [
    {
      "input": "",
      "expectedOutput": "Hello World"
    }
  ]
}
3. Problem Endpoints (Requires Admin Role)
Get All Problems

Method: GET
URL: {{base_url}}/api/problems
Headers:
Authorization: Bearer {{token}}
Get Problem by ID

Method: GET
URL: {{base_url}}/api/problems/{problem_id}
Headers:
Authorization: Bearer {{token}}
Get Problem by Slug

Method: GET
URL: {{base_url}}/api/problems/slug/two-sum
Headers:
Authorization: Bearer {{token}}
4. Health Check
Check Server Status

Method: GET
URL: {{base_url}}/api/health
No authentication needed
Check Root Endpoint

Method: GET
URL: {{base_url}}/
No authentication needed
Quick Testing Workflow
Test Health Check (no auth needed)

GET {{base_url}}/api/health
Register a User

POST /api/auth/register
Login

POST /api/auth/login
Copy token to environment variable
Get Current User

GET /api/auth/me with token
Test Sandbox

POST /api/sandbox/run with code
Get Problems

GET /api/problems with token
Important Notes
Token Management: After login, always copy the token to your environment variable {{token}}
Authorization Header: Use Bearer {{token}} format
Content-Type: Set to application/json for all requests
Database: Make sure MongoDB is running on mongodb://localhost:27017
Sandbox: Optional - if you want to test code execution, ensure sandbox is running on port 3001
Would you like me to create a Postman collection file that you can import directly?

Credits used: 0.13
Elapsed time: 19s


Checkpoint
Restore
and how to test scraping api

Kiro
Let me check the scraping routes and controllers to give you the exact endpoints and test cases.

Read file(s)

scrapeRoutes.js

scrapeController.js

codeforcesController.js

hackerrankController.js

gfgController.js
Perfect! Here's how to test all the scraping APIs in Postman:

Scraping API Testing Guide
1. LeetCode Scraping
Endpoint: POST {{base_url}}/api/leetcode/scrape

Body (JSON):

{
  "url": "https://leetcode.com/problems/two-sum/"
}
Example URLs to test:

https://leetcode.com/problems/two-sum/
https://leetcode.com/problems/add-two-numbers/
https://leetcode.com/problems/longest-substring-without-repeating-characters/
2. Codeforces Scraping
Endpoint: POST {{base_url}}/api/codeforces/scrape

Body (JSON):

{
  "url": "https://codeforces.com/problemset/problem/1/A"
}
Example URLs to test:

https://codeforces.com/problemset/problem/1/A
https://codeforces.com/problemset/problem/4/A
https://codeforces.com/problemset/problem/231/A
3. HackerRank Scraping
Endpoint: POST {{base_url}}/api/hackerrank/scrape

Body (JSON):

{
  "url": "https://www.hackerrank.com/challenges/solve-me-first"
}
Example URLs to test:

https://www.hackerrank.com/challenges/solve-me-first
https://www.hackerrank.com/challenges/simple-array-sum
https://www.hackerrank.com/challenges/a-very-big-sum
4. GeeksforGeeks (GFG) Scraping
Endpoint: POST {{base_url}}/api/gfg/scrape

Body (JSON):

{
  "url": "https://www.geeksforgeeks.org/problems/two-sum-pair-with-given-sum/1"
}
Example URLs to test:

https://www.geeksforgeeks.org/problems/two-sum-pair-with-given-sum/1
https://www.geeksforgeeks.org/problems/array-subset-of-another-array/1
Testing Workflow in Postman
Create a new request for each platform
Set Method to POST
Set URL to the endpoint
Go to Body tab → Select raw → Select JSON
Paste the JSON body with a valid problem URL
Click Send
Expected Responses
Success Response (200):

Returns plain text with problem details including:
Problem title
Description
Examples/Test cases
Constraints
Formatted problem data
Error Responses:

400: Invalid URL format
{ "error": "Invalid LeetCode problem URL" }
404: Problem not found
{ "error": "Problem not found" }
504: Request timeout
{ "error": "Request timeout" }
500: Scraping failed
{ "error": "Scraping failed", "details": "error message" }
Important Notes
No Authentication Required: These endpoints don't need a token
Response Format: Returns plain text (not JSON)
Timeout: Some scraping may take 10-30 seconds
Rate Limiting: Be careful not to spam requests to avoid IP blocking
Valid URLs Only: Must use exact URL formats shown above
Quick Test Checklist
 Test LeetCode with https://leetcode.com/problems/two-sum/
 Test Codeforces with https://codeforces.com/problemset/problem/1/A
 Test HackerRank with https://www.hackerrank.com/challenges/solve-me-first
 Test GFG with https://www.geeksforgeeks.org/problems/two-sum-pair-with-given-sum/1
Try these endpoints and let me know if you hit any issues!