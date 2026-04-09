# CleverBooks Settlement Reconciliation Engine

A complete backend service for courier settlement reconciliation and alert management. Automatically detects discrepancies in courier settlements and sends notifications via webhooks.

## Features

- **Settlement Upload**: Accept CSV or JSON files with settlement data (max 1000 rows)
- **Automated Reconciliation**: Detects 5 types of discrepancies:
  - COD Short-remittance
  - Weight Dispute
  - Phantom RTO Charge
  - Overdue Remittance
  - Duplicate Settlement
- **Queue-based Notifications**: Bull queue with retry logic and dead-letter queue
- **Scheduled Jobs**: Runs reconciliation daily at 2:00 AM IST
- **Rate Limiting**: Upload endpoint limited to 5 requests per minute
- **Idempotent Operations**: Re-uploading same batch skips processed records

## Tech Stack

- Node.js + Express.js
- MongoDB + Mongoose
- Bull (Redis-based queue)
- node-cron for scheduled jobs
- multer for file uploads

## Quick Start

### Using Docker (Recommended)

```bash
# Clone and navigate to backend
cd backend

# Start all services
docker-compose up -d

# Seed the database
docker-compose exec app node seeds/seed.js

# Trigger reconciliation
curl -X POST http://localhost:5000/api/jobs/trigger
```

### Manual Setup

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# - Set MONGO_URI if using external MongoDB
# - Set REDIS_URL if using external Redis
# - Set WEBHOOK_URL for notifications

# Ensure MongoDB and Redis are running
# Then start the server
pnpm start

# In another terminal, start the notification worker
pnpm run worker

# Seed the database
pnpm run seed

# Reset and reseed the database
pnpm run reset:db
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| MONGO_URI | MongoDB connection string | mongodb://localhost:27017/cleverbooks |
| REDIS_URL | Redis connection string | redis://localhost:6379 |
| WEBHOOK_URL | Notification webhook URL | https://webhook.site/test |
| FRONTEND_URL | Allowed browser origin for the frontend | http://localhost:3000 |
| CRON_SCHEDULE | Reconciliation schedule (cron) | 0 2 * * * (2 AM) |
| RATE_LIMIT_WINDOW_MS | Rate limit window | 60000 |
| RATE_LIMIT_MAX | Max requests per window | 5 |

Set `FRONTEND_URL` to your deployed frontend domain when the frontend and backend are hosted separately. You can also provide a comma-separated list if you need to allow more than one origin.

## API Endpoints

### Settlements

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/settlements/upload | Upload settlements (CSV/JSON) |
| GET | /api/settlements | List settlements (filter by status) |
| GET | /api/settlements/:awbNumber | Get settlement by AWB |

### Jobs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/jobs | Last 10 reconciliation jobs |
| POST | /api/jobs/trigger | Manually trigger reconciliation |
| GET | /api/jobs/:jobId | Get job details |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/notifications | Notification logs |
| GET | /api/notifications/queue-stats | Bull queue statistics |
| GET | /api/notifications/:id | Get notification by ID |

### Stats

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/stats | Summary statistics and breakdown |

## Discrepancy Rules

1. **COD Short-remittance**: `settledCodAmount < (codAmount - min(codAmount * 0.02, 10))`
2. **Weight Dispute**: `chargedWeight > declaredWeight * 1.10`
3. **Phantom RTO Charge**: `rtoCharge > 0 AND orderStatus === "DELIVERED"`
4. **Overdue Remittance**: `deliveryDate is 14+ days ago AND no settlementDate`
5. **Duplicate Settlement**: `same awbNumber in multiple batchIds`

## Queue Architecture

- Reconciliation job pushes discrepancy events to `notification-queue`
- Separate worker consumes the queue and sends webhooks
- Retry with exponential back-off: 5s, 30s, 120s
- Failed notifications go to `notification-dead-letter` queue

## Sample Upload File (CSV)

```csv
awbNumber,settledCodAmount,chargedWeight,forwardCharge,rtoCharge,codHandlingFee,settlementDate,batchId
AWB00000001,1500.00,2.5,100.00,0,25.00,2024-01-15,BATCH-003
AWB00000002,2000.00,3.0,120.00,0,30.00,2024-01-15,BATCH-003
```

## Sample Upload File (JSON)

```json
[
  {
    "awbNumber": "AWB00000001",
    "settledCodAmount": 1500.00,
    "chargedWeight": 2.5,
    "forwardCharge": 100.00,
    "rtoCharge": 0,
    "codHandlingFee": 25.00,
    "settlementDate": "2024-01-15",
    "batchId": "BATCH-003"
  }
]
```

## Testing the Flow

1. **Seed data**: `pnpm run seed`
2. **Reset database**: `pnpm run reset:db`
3. **Trigger reconciliation**: `curl -X POST http://localhost:5000/api/jobs/trigger`
4. **Check job status**: `curl http://localhost:5000/api/jobs`
5. **View discrepancies**: `curl http://localhost:5000/api/settlements?status=DISCREPANCY`
6. **View notifications**: `curl http://localhost:5000/api/notifications`
7. **View stats**: `curl http://localhost:5000/api/stats`

## Project Structure

```
backend/
├── models/           # Mongoose schemas
├── routes/           # Express routes
├── controllers/      # Route handlers
├── services/         # Business logic
├── workers/          # Queue workers
├── queues/           # Bull queue setup
├── jobs/             # Scheduled jobs
├── seeds/            # Database seeding
├── middleware/       # Express middleware
├── utils/            # Utility functions
├── server.js         # Main entry point
├── docker-compose.yml
├── Dockerfile
└── .env.example
```

## Debug Tools (Docker)

To enable MongoDB and Redis admin interfaces:

```bash
docker-compose --profile debug up -d
```

- Redis Commander: http://localhost:8081
- Mongo Express: http://localhost:8082 (admin/admin)
