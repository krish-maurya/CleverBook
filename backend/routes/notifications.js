import express from 'express';
import { listNotifications, getNotificationById, getQueueStatsEndpoint } from '../controllers/notificationController.js';

const router = express.Router();

/**
 * GET /api/notifications
 * Get notification delivery logs with status filter
 * Query params: ?status=PENDING|SENT|FAILED|RETRIED|DEAD_LETTER&page=1&limit=50
 */
router.get('/', listNotifications);

/**
 * GET /api/notifications/queue-stats
 * Get Bull queue statistics
 */
router.get('/queue-stats', getQueueStatsEndpoint);

/**
 * GET /api/notifications/:id
 * Get notification by ID
 */
router.get('/:id', getNotificationById);

export default router;
