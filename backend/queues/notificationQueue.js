import Bull from 'bull';

let notificationQueue = null;
let deadLetterQueue = null;

/**
 * Build Redis config safely
 */
function buildRedisConfig() {
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  const url = new URL(redisUrl);

  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    password: url.password || undefined,
    username: url.username || undefined,

    // ✅ TLS fix for cloud Redis
    tls: redisUrl.startsWith('rediss://')
      ? { rejectUnauthorized: false }
      : undefined,

    // ✅ Important for timeout issues
    connectTimeout: 10000,
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  };
}

try {
  const redisConfig = buildRedisConfig();

  console.log('[Queue] Connecting to Redis:', {
    host: redisConfig.host,
    port: redisConfig.port,
    tls: !!redisConfig.tls
  });

  /**
   * Main notification queue
   */
  notificationQueue = new Bull('notification-queue', {
    redis: redisConfig,

    limiter: {
    max: 5,        // max jobs
    duration: 1000 // per 1 second
  },

    settings: {
      stalledInterval: 30000,
      lockDuration: 60000,
      maxStalledCount: 1
    },

    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'fixed',
        delay: Number(process.env.NOTIFICATION_RETRY_DELAY_MS || 5000)
      },
      removeOnComplete: 100,
      removeOnFail: 500
    }
  });

  /**
   * Dead letter queue
   */
  deadLetterQueue = new Bull('notification-dead-letter', {
    redis: redisConfig,
    defaultJobOptions: {
      removeOnComplete: false
    }
  });

  /**
   * 🔥 Connection Logs (VERY IMPORTANT)
   */
  notificationQueue.on('ready', () => {
    console.log('[NotificationQueue] Redis connection ready');
  });

  notificationQueue.on('error', (err) => {
    console.error('[NotificationQueue] Redis error:', err.message);
  });

  notificationQueue.on('waiting', (jobId) => {
    console.log('[NotificationQueue] Job waiting:', jobId);
  });

  notificationQueue.on('active', (job) => {
    console.log(`[NotificationQueue] Job ${job.id} started`);
  });

  notificationQueue.on('completed', (job) => {
    console.log(`[NotificationQueue] Job ${job.id} completed`);
  });

  /**
   * 🔥 Failed job + Dead Letter Logic
   */
  notificationQueue.on('failed', async (job, err) => {
    console.error(
      `[NotificationQueue] Job ${job.id} failed (Attempt ${job.attemptsMade}):`,
      err.message
    );

    if (job.attemptsMade >= 3 && deadLetterQueue) {
      try {
        await deadLetterQueue.add('dead-letter', {
          originalJobId: job.id,
          data: job.data,
          error: err.message,
          failedAt: new Date().toISOString(),
          attempts: job.attemptsMade
        });

        console.log(
          `[NotificationQueue] Job ${job.id} moved to dead letter queue`
        );
      } catch (dlqErr) {
        console.error('[DeadLetterQueue] Failed:', dlqErr.message);
      }
    }
  });

} catch (err) {
  console.error('[Queue] Failed to initialize Redis queues:', err.message);
}

/**
 * 🔥 Safe Add Job (with timeout + retry protection)
 */
export async function addNotificationJob(data) {
  if (!notificationQueue) {
    throw new Error('Notification queue is not initialized');
  }

  try {
    const job = await Promise.race([
      notificationQueue.add('send-notification', data),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Queue add timeout')), 10000)
      )
    ]);

    console.log(
      `[NotificationQueue] Added job ${job.id} for AWB ${data.awbNumber}`
    );

    return job;

  } catch (err) {
    console.error(
      `[NotificationQueue] Failed to enqueue AWB ${data.awbNumber}:`,
      err.message
    );

    // Optional: fallback logic here (DB / log / retry)
    return null;
  }
}



export { notificationQueue, deadLetterQueue };

export default {
  notificationQueue,
  deadLetterQueue,
  addNotificationJob
};