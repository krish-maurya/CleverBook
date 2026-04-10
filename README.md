## Demo Video

[Demo Video Link](https://youtu.be/UljWDgG4Kak?si=ZckRn5I7gt1rY6nJ)

# Clever Book

Clever Book is a courier settlement reconciliation system. Upload settlement files, automatically detect mismatches, review results in the dashboard, and track notifications in one place.

## User Flow

1. Open the dashboard.
2. Upload a settlement file in CSV or JSON format.
3. The system reconciles the data and flags discrepancies.
4. Review jobs, settlements, notifications, and stats.
5. Trigger a manual reconciliation run when needed.

## What It Covers

- Settlement upload and validation.
- Automated discrepancy detection for COD, weight, RTO, overdue remittance, and duplicate settlements.
- Dashboard views for jobs, settlements, notifications, and summary stats.
- Background notification processing with retries.

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm (or pnpm)
- MongoDB (local or remote)
- Redis (local or remote)

### 1) Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Update `.env` if needed (for external services):

- `MONGO_URI`
- `REDIS_URL`
- `WEBHOOK_URL`
- `FRONTEND_URL`

Then seed and run backend services:

```bash
npm run seed
npm run dev:all
```

Expected backend URL: `http://localhost:5252`

### 2) Frontend Setup

```bash
cd frontend
pnpm install
pnpm dev
```

Expected frontend URL: `http://localhost:3000`

### 3) Verify End-to-End Flow

1. Open the frontend dashboard at `http://localhost:3000`.
2. Upload `flow-test-settlements.csv` or `flow-test-settlements.json` from the repo root.
3. Confirm discrepancies appear in settlements and stats.
4. Trigger manual reconciliation from Jobs and verify a new job entry.

### Optional: Backend via Docker

If you prefer containerized setup, see [backend/README.md](backend/README.md) for Docker-based commands.

## Design Decisions

- Express + MongoDB for rapid API development and flexible settlement schemas.
- Rule-based reconciliation in backend services for clear, auditable discrepancy logic.
- Bull + Redis queue for notification processing to isolate retries/failures from API latency.
- Scheduled reconciliation (cron) plus manual trigger for both automation and operator control.
- Idempotency checks on uploads to avoid duplicate processing during repeated submissions.
- Separate dashboard views (jobs, settlements, notifications, stats) to improve traceability.

## Assumptions

- Settlement input files are trusted to have valid headers/fields expected by the parser.
- AWB numbers uniquely identify shipments for reconciliation and duplicate detection.
- A discrepancy should be flagged when any defined business rule is violated.
- Redis and MongoDB are available before starting backend workers and cron jobs.
- Notification delivery can be eventually consistent (queue retries are acceptable).
- This project targets local/dev usage first; production hardening is partial.

## What I Would Improve With More Time

- Add automated tests: unit tests for rules, integration tests for upload/reconcile flow, and API contract tests.
- Add authentication + role-based access control for operational endpoints.
- Improve observability: structured logs, metrics, and tracing across API, queue, and worker.
- Make discrepancy rules configurable via admin settings instead of code constants.
- Add stronger file validation and richer error UX for malformed CSV/JSON rows.
- Introduce CI pipeline checks (lint, typecheck, tests) and release automation.


## Project Layout

- `backend/` API, jobs, queues, workers, and database logic.
- `frontend/` Next.js dashboard and UI components.

For the full backend API reference and environment variables, see [backend/README.md](backend/README.md).
