import express from 'express';
import { getStats } from '../controllers/statsController.js';

const router = express.Router();

/**
 * GET /api/stats
 * Get summary statistics including:
 * - Total discrepancy value in INR
 * - Courier-wise breakdown
 * - Discrepancy type breakdown
 * - Notification stats
 */
router.get('/', getStats);

export default router;
