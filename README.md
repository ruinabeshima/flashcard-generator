# ApplyWise

A full-stack application where users can sign in, view their job applications and receive personalised insights.

<img width="1470" height="921" alt="Screenshot 2026-03-04 at 10 14 19" src="https://github.com/user-attachments/assets/2bb2a298-403f-4d16-b910-d54f84cc11b2" />

## Tech Stack

- **Languages:** Typescript, TailwindCSS
- **Frontend framework:** React + Vite
- **Backend framework:** NodeJS + Express
- **Frontend Component Library:** DaisyUI
- **Authentication and User Management:** Clerk
- **ORM:** PrismaORM
- **Containerisation:** Docker
- **Database:** PostgreSQL (Neon)
- **CI/CD:** Github Actions
- **Deployment:** Google Cloud Run for the frontend, Render for the backend

## Features

### Resume Suggestions and OpenAI Integration

- Users can use AI to review their resume and tailor it to fit specific job applications.
- OpenAI's API analyzes the resume against job requirements and provides specific, actionable suggestions.
- Suggestions are grouped into four categories:
  - `miss:` Skills or requirements from the job description that are absent from the resume
  - `improve:` Existing resume content that could be strengthened with metrics, stronger action verbs, or better framing
  - `add:` Relevant experience or projects worth mentioning that aren't currently highlighted
  - `weak:` Content that doesn't align with the role and should be removed or reframed

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

## Workflow / Logic of the Application

### Tailoring

**1. User clicks "Tailor Resume" on a job application**

- Backend analyses job description and resume text via OpenAI
- AI returns suggestions in JSON format: `{"miss":[],"improve":[],"add":[],"weak":[]}`
- A `TailoringSession` is created to track the tailoring process

**2. User reviews suggestions individually**

- Frontend displays suggestions grouped by category
- User accepts or dismisses each suggestion
- Decisions are saved, and dismissed suggestions will not be used in the final resume
- User's decisions are stored as indices - `e.g ["miss-0", "miss-1", "improve-2", "add-1"]` - allowing the system to track which specific suggestions were accepted or dismissed

**3. User generates tailored resume**

- Only accepted suggestions are incorporated into the final resume
- Backend rewrites the resume using OpenAI with the filtered suggestions
- Tailored resume is saved with a name entered by the user

**4. User downloads or views tailored version**

- All tailored resumes are linked to the original application

## Server API Routes

| Method | Endpoint                        | Description                                                                    |
| ------ | ------------------------------- | ------------------------------------------------------------------------------ |
| GET    | `/applications`                 | Paginated list of user's job application (query params: `pageNum`, `pageSize`) |
| POST   | `/applications/add`             | Create a new job application                                                   |
| GET    | `/applications/:id`             | Retrieve a specific application by ID                                          |
| PATCH  | `/applications/:id`             | Update application details                                                     |
| DELETE | `/applications/:id`             | Delete an application                                                          |
| GET    | `/auth/status`                  | Get user's onboarding status                                                   |
| PATCH  | `/auth/status`                  | Mark onboarding as complete                                                    |
| GET    | `/resumes`                      | Get pre-signed URL to view resume (expires in 1 hour)                          |
| POST   | `/resumes/upload`               | Upload or replace user's resume (PDF only, max 10MB)                           |
| POST   | `/feedback/:applicationId`      | Start tailoring session and get AI suggestions for an application              |
| POST   | `/feedback/update/:sessionId`   | Accept or dismiss individual suggestions                                       |
| POST   | `/feedback/generate/:sessionId` | Generate final tailored resume from accepted suggestions                       |
| POST   | `/webhooks/clerk`               | Receive Clerk webhook to sync user data with database                          |

## Database Models

### Tables

- `User`: id, clerkId, email, imageUrl, createdAt, updatedAt, onboarding_complete
- `Application`: id, role, company, status, appliedDate, notes, jobUrl, userId, createdAt, updatedAt
- `Resume`: id, key, userId, uploadedAt, updatedAt
- `AuditLog`: id, userId, event, description, entityType, entityId, createdAt
- `TailoringSession`: id, applicationId, userId, suggestions, acceptedSuggestions, dismissedSuggestions, status, createdAt, updatedAt, tailoredResume
- `TailoredResume`: id, tailoringSessionId, applicationId, userId, name, content, createdAt

### Enumerated Values

`Status`: APPLIED, INTERVIEW, OFFER, REJECTED
`AuditEvent`: USER_CREATED, USER_UPDATED, USER_DELETED, ONBOARDING_COMPLETED, APPLICATION_CREATED, APPLICATION_UPDATED, APPLICATION_DELETED, RESUME_UPLOADED, TAILORING_SESSION_CREATED, TAILORING_SUGGESTIONS_REVIEWED, RESUME_TAILORED
`TailoringSessionStatus`: PENDING, REVIEWED, TAILORED

## Environment Variables

### Client

VITE_SERVER_URL
VITE_CLERK_PUBLISHABLE_KEY

### Server

- PORT
- CLIENT_URL
- POSTGRES_USER
- POSTGRES_PASSWORD
- DATABASE_URL
- CLERK_PUBLISHABLE_KEY
- CLERK_SECRET_KEY
- CLERK_WEBHOOK_SECRET
- R2_ACCOUNT_ID
- R2_ACCESS_KEY_ID
- R2_SECRET_ACCESS_KEY
- R2_BUCKET_NAME
- OPENAI_API_KEY

## Getting started

- Install dependencies
  - `cd client && pnpm install`
  - `cd ../server && pnpm install`

- Start server docker container
  `docker-compose up -d` (from `/server`)

- Start development servers
  - `pnpm dev` (from `/client`)
  - `pnpm dev` (from `/server`)

## Background Image
https://www.freepik.com/free-vector/abstract-seamless-geometric-shape-lines-pattern-design-background_386291308.htm#fromView=keyword&page=1&position=1&uuid=73ee21b1-a895-4e6b-952f-5deac1313597&query=Background+pattern

