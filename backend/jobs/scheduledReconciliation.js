import cron from 'node-cron';
import { runReconciliation } from '../services/reconciliationService.js';

// Default: 2:00 AM IST (which is 20:30 UTC the previous day)
// Cron format: minute hour day-of-month month day-of-week
const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '0 2 * * *';

let scheduledJob = null;

/**
 * Start the scheduled reconciliation job
 * Runs daily at 2:00 AM IST
 */
export function startScheduledReconciliation() {
  console.log(`[ScheduledJob] Initializing reconciliation cron job`);
  console.log(`[ScheduledJob] Schedule: ${CRON_SCHEDULE} (Asia/Kolkata timezone)`);

  // Validate cron expression
  if (!cron.validate(CRON_SCHEDULE)) {
    console.error(`[ScheduledJob] Invalid cron expression: ${CRON_SCHEDULE}`);
    return;
  }

  scheduledJob = cron.schedule(CRON_SCHEDULE, async () => {
    console.log(`[ScheduledJob] Starting scheduled reconciliation at ${new Date().toISOString()}`);
    
    try {
      const result = await runReconciliation();
      console.log(`[ScheduledJob] Reconciliation completed:`, result);
    } catch (err) {
      console.error(`[ScheduledJob] Reconciliation failed:`, err.message);
    }
  }, {
    timezone: 'Asia/Kolkata'
  });

  console.log('[ScheduledJob] Reconciliation job scheduled successfully');
}

/**
 * Stop the scheduled job
 */
export function stopScheduledReconciliation() {
  if (scheduledJob) {
    scheduledJob.stop();
    console.log('[ScheduledJob] Reconciliation job stopped');
  }
}

/**
 * Get next scheduled run time
 */
export function getNextRunTime() {
  // Simple calculation for next 2 AM IST
  const now = new Date();
  const nextRun = new Date(now);
  
  // Set to 2:00 AM
  nextRun.setHours(2, 0, 0, 0);
  
  // If it's already past 2 AM today, set to tomorrow
  if (now.getHours() >= 2) {
    nextRun.setDate(nextRun.getDate() + 1);
  }
  
  return nextRun;
}

export default {
  startScheduledReconciliation,
  stopScheduledReconciliation,
  getNextRunTime
};
