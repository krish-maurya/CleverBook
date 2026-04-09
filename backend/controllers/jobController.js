import { Job } from '../models/index.js';
import { runReconciliation } from '../services/reconciliationService.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Get last 10 reconciliation job logs
 * GET /api/jobs
 */
export async function listJobs(req, res) {
  try {
    const jobs = await Job.find()
      .sort({ runAt: -1 })
      .limit(10)
      .lean();

    return successResponse(res, { jobs }, 'Job logs retrieved');

  } catch (err) {
    console.error('[JobController] List error:', err);
    return errorResponse(res, 'Failed to retrieve job logs', 500);
  }
}

/**
 * Manually trigger reconciliation job
 * POST /api/jobs/trigger
 */
export async function triggerReconciliation(req, res) {
  try {
    console.log('[JobController] Manual reconciliation triggered');

    // Run reconciliation in background
    const jobPromise = runReconciliation();

    // Return immediately with job started message
    return successResponse(res, {
      message: 'Reconciliation job started',
      startedAt: new Date().toISOString()
    }, 'Job triggered successfully');

  } catch (err) {
    console.error('[JobController] Trigger error:', err);
    return errorResponse(res, `Failed to trigger reconciliation: ${err.message}`, 500);
  }
}

/**
 * Get specific job details
 * GET /api/jobs/:jobId
 */
export async function getJobById(req, res) {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId).lean();

    if (!job) {
      return errorResponse(res, 'Job not found', 404);
    }

    return successResponse(res, { job }, 'Job details retrieved');

  } catch (err) {
    console.error('[JobController] Get by ID error:', err);
    return errorResponse(res, 'Failed to retrieve job', 500);
  }
}

export default {
  listJobs,
  triggerReconciliation,
  getJobById
};
