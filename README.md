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

## Local Setup

Backend:

```bash
cd backend
npm install
cp .env.example .env
npm run seed
npm run dev:all
```

Frontend:

```bash
cd frontend
pnpm install
npm run dev
```


## Project Layout

- `backend/` API, jobs, queues, workers, and database logic.
- `frontend/` Next.js dashboard and UI components.

For the full backend API reference and environment variables, see [backend/README.md](backend/README.md).
