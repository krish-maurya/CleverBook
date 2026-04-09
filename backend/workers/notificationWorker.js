import 'dotenv/config';
import mongoose from 'mongoose';
import { notificationQueue, deadLetterQueue } from '../queues/notificationQueue.js';
import Notification from '../models/Notification.js';

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://webhook.site/d8c272b7-4b88-4aa4-9b05-fc23c0d836d9';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cleverbooks';

// Retry delays in milliseconds: 5s, 30s, 120s
const RETRY_DELAYS = [5000, 30000, 120000];

/**
 * Connect to MongoDB
 */
async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[NotificationWorker] Connected to MongoDB');
  } catch (err) {
    console.error('[NotificationWorker] MongoDB connection error:', err);
    process.exit(1);
  }
}

/**
 * Send webhook notification
 */
async function sendWebhook(payload) {
  console.log(`[NotificationWorker] Sending webhook for AWB ${payload.awbNumber}`);
  
  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Idempotency-Key': payload.idempotencyKey
    },
    body: JSON.stringify({
      merchantId: payload.merchantId,
      awbNumber: payload.awbNumber,
      discrepancyType: payload.discrepancyType,
      expectedValue: payload.expectedValue,
      actualValue: payload.actualValue,
      suggestedAction: payload.suggestedAction,
      timestamp: new Date().toISOString()
    })
  });

  if (!response.ok) {
    throw new Error(`Webhook failed with status ${response.status}: ${response.statusText}`);
  }

  const responseData = await response.text();
  return { status: response.status, data: responseData };
}

/**
 * Process notification job
 */
notificationQueue.process('send-notification', async (job) => {
  const { notificationId, merchantId, awbNumber, discrepancyType, expectedValue, actualValue, suggestedAction, idempotencyKey } = job.data;

  console.log(`[NotificationWorker] Processing job ${job.id} for AWB ${awbNumber} (attempt ${job.attemptsMade + 1})`);

  try {
    // Send webhook
    const result = await sendWebhook(job.data);

    // Update notification status in MongoDB
    await Notification.findByIdAndUpdate(notificationId, {
      status: 'SENT',
      attempts: job.attemptsMade + 1,
      lastAttemptAt: new Date(),
      webhookResponse: result
    });

    console.log(`[NotificationWorker] Successfully sent notification for AWB ${awbNumber}`);
    return result;

  } catch (err) {
    console.error(`[NotificationWorker] Failed to send notification for AWB ${awbNumber}:`, err.message);

    // Update notification with error
    const updateData = {
      attempts: job.attemptsMade + 1,
      lastAttemptAt: new Date(),
      errorMessage: err.message
    };

    if (job.attemptsMade >= 2) {
      // Final attempt failed - mark as DEAD_LETTER
      updateData.status = 'DEAD_LETTER';
      console.log(`[NotificationWorker] Moving AWB ${awbNumber} to dead letter queue`);
    } else {
      // More retries available
      updateData.status = 'RETRIED';
    }

    await Notification.findByIdAndUpdate(notificationId, updateData);

    throw err; // Re-throw to trigger Bull retry
  }
});

/**
 * Handle completed jobs
 */
notificationQueue.on('completed', (job, result) => {
  console.log(`[NotificationWorker] Job ${job.id} completed successfully`);
});

/**
 * Handle failed jobs (after all retries)
 */
notificationQueue.on('failed', async (job, err) => {
  if (job.attemptsMade >= 3) {
    console.log(`[NotificationWorker] Job ${job.id} permanently failed after ${job.attemptsMade} attempts`);
    
    // Move to dead letter queue
    await deadLetterQueue.add('dead-letter', {
      originalJobId: job.id,
      data: job.data,
      error: err.message,
      failedAt: new Date().toISOString(),
      attempts: job.attemptsMade
    });
  }
});

/**
 * Handle stalled jobs
 */
notificationQueue.on('stalled', (job) => {
  console.warn(`[NotificationWorker] Job ${job.id} has stalled`);
});

/**
 * Process dead letter queue (for monitoring/alerting)
 */
deadLetterQueue.process('dead-letter', async (job) => {
  console.log(`[NotificationWorker] Dead letter received: AWB ${job.data.data.awbNumber}`);
  // In production, you might want to alert ops team here
  return { processed: true };
});

/**
 * Graceful shutdown
 */
async function shutdown() {
  console.log('[NotificationWorker] Shutting down gracefully...');
  
  await notificationQueue.close();
  await deadLetterQueue.close();
  await mongoose.connection.close();
  
  console.log('[NotificationWorker] Shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

/**
 * Start the worker
 */
async function start() {
  console.log('[NotificationWorker] Starting notification worker...');
  console.log(`[NotificationWorker] Webhook URL: ${WEBHOOK_URL}`);
  
  await connectDB();
  
  console.log('[NotificationWorker] Worker is ready and listening for jobs');
}

start().catch((err) => {
  console.error('[NotificationWorker] Failed to start:', err);
  process.exit(1);
});

export default {
  notificationQueue,
  deadLetterQueue
};
