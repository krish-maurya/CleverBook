import { Notification } from '../models/index.js';
import { getQueueStats } from '../queues/notificationQueue.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Get notification delivery logs
 * GET /api/notifications
 */
export async function listNotifications(req, res) {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (status && ['PENDING', 'SENT', 'FAILED', 'RETRIED', 'DEAD_LETTER'].includes(status)) {
      query.status = status;
    }

    const [notifications, total, queueStats] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Notification.countDocuments(query),
      getQueueStats()
    ]);

    return successResponse(res, {
      notifications,
      queueStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }, 'Notifications retrieved successfully');

  } catch (err) {
    console.error('[NotificationController] List error:', err);
    return errorResponse(res, 'Failed to retrieve notifications', 500);
  }
}

/**
 * Get notification by ID
 * GET /api/notifications/:id
 */
export async function getNotificationById(req, res) {
  try {
    const { id } = req.params;

    const notification = await Notification.findById(id).lean();

    if (!notification) {
      return errorResponse(res, 'Notification not found', 404);
    }

    return successResponse(res, { notification }, 'Notification details retrieved');

  } catch (err) {
    console.error('[NotificationController] Get by ID error:', err);
    return errorResponse(res, 'Failed to retrieve notification', 500);
  }
}

/**
 * Get queue statistics
 * GET /api/notifications/queue-stats
 */
export async function getQueueStatsEndpoint(req, res) {
  try {
    const stats = await getQueueStats();
    return successResponse(res, { stats }, 'Queue stats retrieved');
  } catch (err) {
    console.error('[NotificationController] Queue stats error:', err);
    return errorResponse(res, 'Failed to retrieve queue stats', 500);
  }
}

export default {
  listNotifications,
  getNotificationById,
  getQueueStatsEndpoint
};
