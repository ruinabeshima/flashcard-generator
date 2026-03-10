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

- User registration and login via Clerk
- Multi-step onboarding flow (upload resume + add first application)
- Full CRUD for job applications
- Application status tracking: `APPLIED`, `INTERVIEW`, `OFFER`, `REJECTED`
- Paginated application list sorted by date applied
- Resume upload and management; PDF only, stored on Cloudflare R2
- Secure resume viewing via pre-signed URLs
- Protected routes: unauthorised users are redirected to `/login`, and un-onboarded users are redirected to `/onboarding`

### Audit Logging

- All user-triggered events are logged to the database for compliance and debugging.
- Events consist of:
  - User account creation, updates, and deletion
  - Onboarding completion
  - Job application CREATE, UPDATE and DELETE operations
  - Resume uploads and replacements
- Each audit entry consists of the userId, event name (enumerated values), optional description, entity type (User, Application, Resume) and timestamp.
- Audit logs can be queried to track user actions or to investigate issues.

### Structured Logging

- All server errors and warnings are logged using Winston for easy debugging during production.
- Implementation of:
  - **Errors**: Database failures, file upload errors, webhook verification failures
  - **Warnings**: Unauthorised access attempts, missing resources, validation errors
- Logs are output to stdout in JSON format, making them queryable in production environments (Google Cloud Run Logs, Render Logs, etc.)

## Server API Routes

| Method | Endpoint            | Description                                                                    |
| ------ | ------------------- | ------------------------------------------------------------------------------ |
| GET    | `/applications`     | Paginated list of user's job application (query params: `pageNum`, `pageSize`) |
| POST   | `/applications/add` | Create a new job application                                                    |
| GET    | `/applications/:id` | Retrieve a specific application by ID                                          |
| PATCH  | `/applications/:id` | Update application details                                                     |
| DELETE | `/applications/:id` | Delete an application                                                          |
| GET    | `/auth/status`      | Get user's onboarding status                                                   |
| PATCH  | `/auth/status`      | Mark onboarding as complete                                                    |
| GET    | `/resumes`          | Get pre-signed URL to view resume (expires in 1 hour)                          |
| POST   | `/resumes/upload`   | Upload or replace user's resume (PDF only, max 10MB)                           |
| POST   | `/webhooks/clerk`   | Receive Clerk webhook to sync user data with database                          |

## Database Models

- `User`: id, clerkId, email, imageUrl, createdAt, updatedAt, onboarding_complete
- `Application`: id, role, company, status, appliedDate, notes, jobUrl, userId, createdAt, updatedAt
- `Resume`: id, key, userId, uploadedAt, updatedAt

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

Taken from: https://www.freepik.com/free-vector/abstract-elegant-geometric-shape-background-design_149441939.htm#fromView=keyword&page=1&position=0&uuid=42c7654b-6a10-4813-855b-c347f2986f8a&query=Background+shape
