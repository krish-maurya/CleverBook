import Bull from 'bull';
import Redis from 'ioredis';

const client = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  tls: {}
});

const redisConfig = {
  createClient: () => client
};

/**
 * Main notification queue for discrepancy alerts
 */
export const notificationQueue = new Bull('notification-queue', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'custom'
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 500      // Keep last 500 failed jobs for debugging
  }
});

/**
 * Dead letter queue for permanently failed notifications
 */
export const deadLetterQueue = new Bull('notification-dead-letter', {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: false // Keep all dead letter jobs for manual review
  }
});

/**
 * Custom backoff strategy: 5s, 30s, 120s
 */
notificationQueue.on('failed', async (job, err) => {
  const delays = [5000, 30000, 120000]; // 5s, 30s, 120s
  const attemptIndex = job.attemptsMade - 1;
  
  if (attemptIndex < delays.length - 1) {
    // Set next delay
    job.opts.backoff = { delay: delays[attemptIndex + 1] };
  }
  
  console.log(`[NotificationQueue] Job ${job.id} failed attempt ${job.attemptsMade}:`, err.message);
});

/**
 * Move to dead letter queue after all retries exhausted
 */
notificationQueue.on('failed', async (job, err) => {
  if (job.attemptsMade >= 3) {
    console.log(`[NotificationQueue] Moving job ${job.id} to dead letter queue`);
    
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
 * Add a notification job to the queue
 */
export async function addNotificationJob(data) {
  const job = await notificationQueue.add('send-notification', data, {
    backoff: {
      type: 'custom',
      delay: 5000 // First retry after 5s
    }
  });
  
  console.log(`[NotificationQueue] Added job ${job.id} for AWB ${data.awbNumber}`);
  return job;
}

/**
 * Get queue stats
 */
export async function getQueueStats() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    notificationQueue.getWaitingCount(),
    notificationQueue.getActiveCount(),
    notificationQueue.getCompletedCount(),
    notificationQueue.getFailedCount(),
    notificationQueue.getDelayedCount()
  ]);
  
  const deadLetterCount = await deadLetterQueue.getWaitingCount();
  
  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    deadLetter: deadLetterCount
  };
}

export default {
  notificationQueue,
  deadLetterQueue,
  addNotificationJob,
  getQueueStats
};
