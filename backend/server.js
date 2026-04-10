import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import { settlementsRouter, jobsRouter, notificationsRouter, statsRouter } from './routes/index.js';
import { generalRateLimiter } from './middleware/rateLimiter.js';
import { startScheduledReconciliation } from './jobs/scheduledReconciliation.js';

const app = express();
const PORT = process.env.PORT || 5252;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cleverbooks';
const isTrustProxyEnabled =
  process.env.TRUST_PROXY === 'true' ||
  process.env.TRUST_PROXY === '1' ||
  process.env.NODE_ENV === 'production';

if (isTrustProxyEnabled) {
  app.set('trust proxy', 1);
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Allow frontend app to call backend APIs from the browser.
app.use((req, res, next) => {
  const origin = req.headers.origin;
  res.header('Access-Control-Allow-Origin', origin || '*');

  res.header('Vary', 'Origin');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

// Apply general rate limiter to all routes
app.use(generalRateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    },
    message: 'Server is running'
  });
});

// API Routes
app.use('/api/settlements', settlementsRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/stats', statsRouter);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'CleverBooks Settlement Reconciliation API',
      version: '1.0.0',
      endpoints: {
        settlements: {
          'POST /api/settlements/upload': 'Upload settlements from CSV/JSON (rate limited: 5/min)',
          'GET /api/settlements': 'List all settlements with optional status filter',
          'GET /api/settlements/:awbNumber': 'Get settlement details by AWB number'
        },
        jobs: {
          'GET /api/jobs': 'Get last 10 reconciliation job logs',
          'POST /api/jobs/trigger': 'Manually trigger reconciliation',
          'GET /api/jobs/:jobId': 'Get specific job details'
        },
        notifications: {
          'GET /api/notifications': 'Get notification delivery logs',
          'GET /api/notifications/queue-stats': 'Get Bull queue statistics',
          'GET /api/notifications/:id': 'Get notification by ID'
        },
        stats: {
          'GET /api/stats': 'Get summary statistics and courier breakdown'
        }
      }
    },
    message: 'API documentation'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    message: `Endpoint not found: ${req.method} ${req.path}`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server] Unhandled error:', err);
  res.status(500).json({
    success: false,
    data: null,
    message: 'Internal server error'
  });
});

// Connect to MongoDB and start server
async function startServer() {
  try {
    console.log('[Server] Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('[Server] Connected to MongoDB');

    // Start the scheduled reconciliation job
    startScheduledReconciliation();

    app.listen(PORT, () => {
      console.log(`[Server] CleverBooks Settlement Engine running on port ${PORT}`);
      console.log(`[Server] API documentation: http://localhost:${PORT}/api`);
      console.log(`[Server] Health check: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error('[Server] Failed to start:', err);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  console.log('[Server] Shutting down gracefully...');
  await mongoose.connection.close();
  console.log('[Server] MongoDB connection closed');
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the server
startServer();

export default app;
