import express from 'express';
import { listJobs, triggerReconciliation, getJobById } from '../controllers/jobController.js';

const router = express.Router();

/**
 * GET /api/jobs
 * Get last 10 reconciliation job logs
 */
router.get('/', listJobs);

/**
 * POST /api/jobs/trigger
 * Manually trigger reconciliation job
 */
router.post('/trigger', triggerReconciliation);

/**
 * GET /api/jobs/:jobId
 * Get specific job details
 */
router.get('/:jobId', getJobById);

export default router;
