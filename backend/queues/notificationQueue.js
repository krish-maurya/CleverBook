import Bull from 'bull';
import Redis from 'ioredis';

let notificationQueue = null;
let deadLetterQueue = null;

try {
  const client = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    tls: {},           // Use TLS for services like Upstash
    lazyConnect: true, // Don't connect immediately
  });

  const redisConfig = { createClient: () => client };

  // Main notification queue
  notificationQueue = new Bull('notification-queue', {
    redis: redisConfig,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'custom' },
      removeOnComplete: 100,
      removeOnFail: 500
    }
  });

  // Dead letter queue
  deadLetterQueue = new Bull('notification-dead-letter', {
    redis: redisConfig,
    defaultJobOptions: { removeOnComplete: false }
  });

  // Failed job handling + dead-letter
  notificationQueue.on('failed', async (job, err) => {
    const delays = [5000, 30000, 120000];
    const attemptIndex = job.attemptsMade - 1;

    if (attemptIndex < delays.length - 1) {
      job.opts.backoff = { delay: delays[attemptIndex + 1] };
    }

    console.log(`[NotificationQueue] Job ${job.id} failed attempt ${job.attemptsMade}:`, err.message);

    if (job.attemptsMade >= 3 && deadLetterQueue) {
      await deadLetterQueue.add('dead-letter', {
        originalJobId: job.id,
        data: job.data,
        error: err.message,
        failedAt: new Date().toISOString(),
        attempts: job.attemptsMade
      });
      console.log(`[NotificationQueue] Job ${job.id} moved to dead letter queue`);
    }
  });

} catch (err) {
  console.error('[Queue] Failed to initialize Redis queues:', err.message);
}

// Add job to queue
export async function addNotificationJob(data) {
  if (!notificationQueue) {
    console.warn('[NotificationQueue] Queue not initialized, job skipped');
    return null;
  }

  const job = await notificationQueue.add('send-notification', data, {
    backoff: { type: 'custom', delay: 5000 }
  });

  console.log(`[NotificationQueue] Added job ${job.id} for AWB ${data.awbNumber}`);
  return job;
}

export { notificationQueue, deadLetterQueue };

export default {
  notificationQueue,
  deadLetterQueue,
  addNotificationJob
};