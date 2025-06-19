Resume Screening Backend
Backend for the AI-driven resume screening tool.
Setup

Install dependencies:
npm install

Create .env file:
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/resumeScreeningDB
PYTHON_API_URL=http://localhost:5002
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
EMAIL_FROM=AI Resume Screening <your_email@gmail.com>
Start MongoDB and Redis:
mongod
redis-server

Run the backend:
npm run dev

Testing
Run tests with:
npm test

Endpoints

POST /api/resumes/upload: Upload a resume with job description ID.
GET /api/resumes: Get all resumes (optional: filter by jobDescriptionId).
GET /api/resumes/:id: Get a resume by ID.
DELETE /api/resumes/:id: Delete a resume.
POST /api/resumes/:id/process: Reprocess a resume.
GET /api/resumes/:resumeId/compare/:jobDescriptionId: Compare resume to job.
GET /api/resumes/:id/detect-duplicates: Detect duplicate resumes.
POST /api/job-descriptions: Create a job description.
GET /api/job-descriptions: Get all job descriptions (optional: filter by category).
GET /api/job-descriptions/:id: Get a job description by ID.
PUT /api/job-descriptions/:id: Update a job description.
DELETE /api/job-descriptions/:id: Delete a job description.
