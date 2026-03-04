# ApplyWise

A full-stack application where users can sign in, view their job applications and receive personalised insights.

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

## Background Image

Taken from: https://www.freepik.com/free-vector/abstract-elegant-geometric-shape-background-design_149441939.htm#fromView=keyword&page=1&position=0&uuid=42c7654b-6a10-4813-855b-c347f2986f8a&query=Background+shape

## Server API Routes

| Method | Endpoint            | Description                                                                       |
| ------ | ------------------- | --------------------------------------------------------------------------------- |
| GET    | `/applications`     | Paginated list of all job applications made by the user                           |
| POST   | `/applications/add` | Create a new job application                                                      |
| POST   | `webhooks/clerk`    | Receive Clerk webhook to update User table in database with corresponding ClerkId |

## Database Models

- `User`: id, clerkId, email, imageUrl, createdAt, updatedAt
- `Application`: id, role, company, status, appliedDate, notes, jobUrl, userId, createdAt, updatedAt
