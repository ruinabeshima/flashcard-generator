# ApplyWise

## Overview

Full-stack application with a React frontend and Node.js backend, deployed as separate services.  
Supports secure resume storage, job tracking, and AI-powered resume tailoring with audit logging, rate limiting, and CI/CD pipelines.
Designed to simulate a production-grade job tracking system with AI-assisted resume optimization.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture & Best Practices](#architecture--best-practices)
- [Code Quality](#code-quality)
- [Getting Started](#getting-started)
- [API Routes](#api-routes)
- [Database Models](#database-models)
- [Environment Variables](#environment-variables)
- [Testing](#testing)

## Tech Stack

### Frontend

- React (Vite)
- TypeScript
- Tailwind CSS, DaisyUI
- React Router
- Firebase Authentication
- Playwright (E2E testing)

### Backend

- Node.js, Express
- TypeScript
- Prisma ORM
- PostgreSQL (Neon)

### Infrastructure & DevOps

- Docker
- GitHub Actions (CI/CD)
- Google Cloud Run (frontend)
- Render (backend)
- Cloudflare R2 (file storage)

### Backend Infrastructure

- Zod (validation)
- Helmet, CORS (security)
- Express Rate Limit (rate limiting)
- Winston (logging)

### External Services

- OpenAI API
- Firebase Admin SDK
- Cloudflare R2

### File Handling

- Multer (file uploads)
- pdf-parse (resume parsing)

## Features

### Product Features

#### Job Application Tracking

- **Centralized Dashboard**: View all job applications in an organized grid layout
- **Complete Application Details**: Track role, company, status, application date, notes, and job links
- **Full CRUD operations**
- **Status Management**: Track applications across different statuses (Applied, Interviewing, Rejected, Offer, Negotiating)

#### Resume Management

- **Secure Upload**: Upload resumes (PDF, max 10MB) with server-side validation
- **Pre-signed URLs**: Generate expiring download links (1-hour validity) for secure resume access
- **Version Control**: Maintain and manage multiple resume versions
- **Smart Extraction**: Automated text extraction from PDFs for AI analysis

#### AI-Powered Resume Tailoring

- **Smart Analysis**: OpenAI integration analyzes resume against job requirements
- **Tailoring Limits**: Rate-limited to 3 tailored resumes per user (persists across deletions to prevent abuse)
- **Categorized Suggestions**: Four categories of feedback:
  - `miss:` - Missing skills/requirements from the job description
  - `improve:` - Existing content that could be strengthened
  - `add:` - Relevant experience worth highlighting
  - `weak:` - Content that doesn't align and should be removed
- **User-Controlled**: Accept or dismiss individual suggestions before generating tailored resume
- **Version Tracking**: Access all tailored resumes in `/tailored` page with cloud storage backup

#### User Onboarding

- **Mandatory Setup**: Users must upload resume during onboarding
- **Protected Routes**: Navigation restricted until onboarding completion
- **Efficient Flow**: Get started quickly with initial application entry during onboarding

### Engineering & Architecture

#### Security & Best Practices

- **Centralized Error Handling**: Custom `AppError` class with comprehensive error middleware
  - Handles AppError, Zod validation, Prisma errors, and unexpected errors
  - Consistent JSON error responses with appropriate HTTP status codes
- **Request Authentication**: Firebase JWT verification on all protected routes
- **Authorization Checks**: User ownership verification for all operations (401/403 responses)
- **Security Headers**: Helmet middleware for HTTP security
- **CORS Protection**: Configurable origin validation
- **Input Validation**: Zod schemas for all API inputs with type inference to frontend

#### API Design & Performance

- **Rate Limiting**: Multi-tier rate limiting by operation type:
  - Feedback/Tailoring: 10 requests per hour
  - Resume Upload: 20 requests per hour
  - General Mutations: 50 requests per 15 minutes
- **Pagination Support**: Efficient data loading for large datasets
- **Pre-signed URLs**: One-hour expiring URL generation for file downloads
- **Request Tracking**: Unique request IDs for all API calls (x-request-id header)
- **Health Endpoint**: `/health` for deployment monitoring

#### Code Quality & Maintainability

- **TypeScript Throughout**: End-to-end type safety with strict configurations
- **Shared Types Package**: Centralized global type definitions (`shared/src/types/`)
  - Single source of truth for API contracts across frontend and backend
  - Automatic type inference in API calls
- **JSDoc Comments**: Comprehensive documentation on all route handlers
- **Monorepo Structure**: Organized separation of concerns (client, server, shared)
- **Environment Validation**: Automatic environment variable checking at startup

#### Monitoring & Observability

- **Structured Logging** (Winston):
  - JSON output for production log aggregation
  - Error logs for database failures and file upload failures
  - Warning logs for unauthorized access and validation errors
  - Request logging with timing information
- **Audit Logging**: Complete event tracking to database:
  - User account lifecycle (creation, updates, deletion)
  - Onboarding completion
  - Application CRUD operations
  - Resume uploads and replacements
  - Tailoring sessions and generated resumes
  - Each audit entry includes userId, event type, description, and timestamp

#### Database & Data Integrity

- **Prisma ORM**: Type-safe database queries with auto-generated types
- **Schema Migrations**: Git-tracked database changes with rollback capability
- **Relationships**: Proper constraints and cascading deletes
- **Audit Trail**: TailoringSession records persist after application deletion for tracking
- **Data Consistency**: Transaction support for complex operations

## Architecture & Best Practices

### Centralized API Layer

- **useApiClient Hook**: Single-point-of-entry for all API requests with automatic:
  - Token injection for authorization
  - Consistent error handling
  - Form data detection and header management
  - Type-safe generic requests
  - Support for empty response handling (204 No Content)

### Error Handling Strategy

- **AppError Classes**: Custom error hierarchy for different error types
- **Middleware Pattern**: Express error middleware catches and normalizes all errors
- **Type-Safe Validation**: Zod schemas ensure data integrity at boundaries
- **User-Friendly Messages**: Consistent error response format with actionable messages

### State of Shared Types

- **API Contracts**: Defined in `shared/src/types/api.ts`
- **Type Reusability**: Single source of truth across frontend and backend
- **Type Safety**: Reduces bugs and improves developer experience

## API Routes

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
| POST   | `/tailoring/generate/:sessionId`      | Generate final tailored resume from accepted suggestions                              |
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

## Code Quality

### Testing Strategy

The project implements comprehensive test coverage across frontend and backend:

#### Frontend E2E Tests (Playwright)

- **Authentication** - User login/logout flows with Firebase
- **Onboarding** - Resume upload and first application workflow
- **Applications** - CRUD operations, pagination, sorting, status updates
- **Resume** - Upload, view, and management operations
- **Tailoring** - Full AI suggestion workflow from start to finish

```bash
# Run E2E tests
cd client && pnpm test:e2e

# Run with UI
pnpm test:ui

# Run specific test file
pnpm test auth.spec.ts
```

#### Backend Integration Tests (Jest + Supertest)

- **Applications** - CRUD operations, authorization checks, pagination, error handling
- **Authentication** - Onboarding status management, user auth flow
- **Resumes** - Upload/retrieval, pre-signed URLs, error cases
- **Feedback/Tailoring** - AI suggestion generation, user feedback handling, file conversion

```bash
# Run server tests
cd server && pnpm test

# Run with coverage
pnpm test:coverage
```

## Getting Started

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
