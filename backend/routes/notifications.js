import express from 'express';
import { listNotifications, getNotificationById } from '../controllers/notificationController.js';

const router = express.Router();

/**
 * GET /api/notifications
 * List notifications with optional status filter & pagination
 */
router.get('/', listNotifications);

/**
 * GET /api/notifications/:id
 * Get notification by ID
 */
router.get('/:id', getNotificationById);

export default router;