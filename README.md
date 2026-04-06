# ApplyWise

- Try it out: https://apply-wise-6gx6cmwdmq-an.a.run.app/
- Signed-in users can create and track their job applications.
- They can view their uploaded resume and update them.
- Users can tailor their resumes using AI for a specific job application, and receive various suggestions which they can accept or decline.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Getting Started](#getting-started)
- [API Routes](#server-api-routes)
- [Database Models](#database-models)
- [Environment Variables](#environment-variables)
- [Testing](#testing)

## Tech Stack

**Frontend**

- React + Vite
- TypeScript
- Tailwind CSS + DaisyUI
- React Router
- Firebase Auth

**Backend**

- Node.js + Express
- TypeScript
- Prisma ORM
- Zod
- Winston
- Multer
- OpenAI SDK
- Firebase Admin SDK

**Infrastructure**

- PostgreSQL (Neon)
- Cloudflare R2
- Docker
- GitHub Actions
- Google Cloud Run (frontend) + Render (backend)

## Features

### Onboarding

- Once a user creates an account, they are taken to an onboarding page where they are required to upload their resume, and optionally enter a job application.
- The user cannot navigate to any other page unless they have completed onboarding.

### Job Application Tracking

- Users can see the resume they have uploaded and optionally update it in the `/your-resume` page.
- The `/dashboard` page allows users to see their job applications in a grid layout.
- They can add new applications with required fields `role`, `company`, select `application status`, and optionally enter the application date, add extra notes and add the job link.
- The application date is set to the time the application is created if nothing is entered.
- Users can see the detailed view of a single application, where they have the option to edit, delete or tailor their resume to that application.

### Resume Suggestions and OpenAI Integration

- Users can use AI to review their resume and tailor it to fit specific job applications.
- **Resume Tailoring Limit**: Users can tailor up to 3 resumes with AI. The count is tracked via `TailoringSession` records and persists even after application deletion to prevent users from circumventing the limit.
- OpenAI's API analyzes the resume against job requirements and provides specific, actionable suggestions.
- Suggestions are grouped into four categories:
  - `miss:` Skills or requirements from the job description that are absent from the resume
  - `improve:` Existing resume content that could be strengthened with metrics, stronger action verbs, or better framing
  - `add:` Relevant experience or projects worth mentioning that aren't currently highlighted
  - `weak:` Content that doesn't align with the role and should be removed or reframed
- The user can view all of these suggestions, and have the option to accept or ignore them.
- Once all the suggestions have been reviewed, the AI generates a new resume based on the suggestions that have been accepted.
- Users can view all of their tailored resumes in the `/tailored` page.

### Tests

### Audit Logging

- All user-triggered events are logged to the database for compliance and debugging.
- Events consist of:
  - User account creation, updates, and deletion
  - Onboarding completion
  - Job application CREATE, UPDATE and DELETE operations
  - Resume uploads and replacements
  - Resume tailoring session creation
  - Resume suggestion review
  - Tailored resume generation
- Each audit entry consists of the userId, event name (enumerated values), optional description, entity type (User, Application, Resume, TailoringSession, TailoredResume) and timestamp.
- Audit logs can be queried to track user actions or to investigate issues.

### Structured Logging

- All server errors and warnings are logged using Winston for easy debugging during production.
- Implementation of:
  - **Errors**: Database failures, file upload errors, webhook verification failures
  - **Warnings**: Unauthorised access attempts, missing resources, validation errors
- Logs are output to stdout in JSON format, making them queryable in production environments (Google Cloud Run Logs, Render Logs, etc.)

## Server API Routes

| Method | Endpoint                              | Description                                                                           |
| ------ | ------------------------------------- | ------------------------------------------------------------------------------------- |
| GET    | `/health`                             | Health check endpoint                                                                 |
| GET    | `/applications`                       | Paginated list of user's job application (query params: `pageNum`, `pageSize`)        |
| POST   | `/applications/add`                   | Create a new job application                                                          |
| GET    | `/applications/:id`                   | Retrieve a specific application by ID                                                 |
| PATCH  | `/applications/:id`                   | Update application details                                                            |
| DELETE | `/applications/:id`                   | Delete an application                                                                 |
| GET    | `/auth/status`                        | Get user's onboarding status                                                          |
| PATCH  | `/auth/status`                        | Mark onboarding as complete                                                           |
| GET    | `/resumes`                            | Get pre-signed URL to view resume (expires in 1 hour)                                 |
| GET    | `/resumes/tailored`                   | Get all user's tailored resumes                                                       |
| GET    | `/resumes/tailored/:tailoredResumeId` | Get individual tailored resume URL                                                    |
| POST   | `/resumes/upload`                     | Upload or replace user's resume (PDF only, max 10MB)                                  |
| POST   | `/feedback/:applicationId`            | Start tailoring session and get AI suggestions for an application                     |
| POST   | `/feedback/update/:sessionId`         | Accept or dismiss individual suggestions                                              |
| POST   | `/feedback/generate/:sessionId`       | Generate final tailored resume from accepted suggestions                              |
| GET    | `/tailoring/status/:applicationId`    | Check if tailoring status exists and returns suggestions or tailored resume key if so |
| GET    | `/tailoring/count`                    | Get count of all user's tailoring sessions                                            |

## Database Models

### Tables

- `User`: id, email, imageUrl, createdAt, updatedAt, onboarding_complete
- `Application`: id, role, company, status, appliedDate, notes, jobUrl, userId, createdAt, updatedAt
- `Resume`: id, key, userId, text, uploadedAt, updatedAt
- `AuditLog`: id, userId, event, description, entityType, entityId, createdAt
- `TailoringSession`: id, applicationId, userId, suggestions, acceptedSuggestions, dismissedSuggestions, status, createdAt, updatedAt
- `TailoredResume`: id, key, tailoringSessionId, applicationId, userId, name, content, createdAt

## Environment Variables

### Client

- `VITE_SERVER_URL`: Backend server URL (e.g., `http://localhost:3000`)
- `VITE_FIREBASE_API_KEY`: Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN`: Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID`: Firebase project ID
- `VITE_FIREBASE_APP_ID`: Firebase app ID

### Server

- `PORT`: Server port (default: 3000)
- `CLIENT_URL`: Frontend URL for CORS (e.g., `http://localhost:5173`)
- `POSTGRES_USER`: PostgreSQL username
- `POSTGRES_PASSWORD`: PostgreSQL password
- `DATABASE_URL`: PostgreSQL connection string
- `R2_ACCOUNT_ID`: Cloudflare R2 account ID
- `R2_ACCESS_KEY_ID`: Cloudflare R2 access key
- `R2_SECRET_ACCESS_KEY`: Cloudflare R2 secret key
- `R2_BUCKET_NAME`: Cloudflare R2 bucket name
- `OPENAI_API_KEY`: OpenAI API key for resume tailoring
- `FIREBASE_SERVICE_ACCOUNT`: Firebase service account JSON (for admin SDK)

## Getting started

### Prerequisites

- Node.js 18 or higher
- pnpm (install with: `npm install -g pnpm`)
- Docker and Docker Compose

### Setup

1. **Clone and install dependencies**

   ```bash
   cd client && pnpm install
   cd ../server && pnpm install
   ```

2. **Configure environment variables**

   ```bash
   # Client
   cp client/.env.example client/.env

   # Server
   cp server/.env.example server/.env
   ```

   Update both `.env` files with your credentials (Firebase, OpenAI, Cloudflare R2, PostgreSQL)

3. **Start the database**

   ```bash
   docker-compose up -d
   ```

   (from `/server` directory)

4. **Run database migrations**

   ```bash
   pnpm prisma migrate dev
   ```

   (from `/server` directory)

5. **Start development servers**
   - Client: `pnpm dev` (from `/client`)
   - Server: `pnpm dev` (from `/server`)

The client will be available at `http://localhost:5173` and the server at `http://localhost:3000`

### Testing

The project includes comprehensive integration tests for all API routes using Jest and Supertest:

**Tested Routes:**

- **Applications** - CRUD operations for job applications, including authorization checks, pagination and error handling
- **Authentication** - Onboarding status retrieval and completion, user authentication flow
- **Resumes** - Resume upload/retrieval, pre-signed URL generation, and error cases
- **Feedback/Tailoring** - Resume tailoring workflow including AI suggestion generation, user feedback acceptance, and tailored resume generation with file conversion and cloud storage

**Test Coverage:**

- Authorization and authentication (401/403 responses)
- Success paths with mocked external services (OpenAI, Cloudflare R2)
- Database failures and error handling (500 responses)
- Input validation and constraints
- Mock implementations for prisma, audit logging, and file conversion

```bash
# Run tests
cd server && pnpm test

# Run tests with coverage
pnpm test:coverage
```
