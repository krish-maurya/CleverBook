import express from 'express';
import { uploadSettlements, listSettlements, getSettlementByAwb } from '../controllers/settlementController.js';
import { upload, handleUploadError } from '../middleware/upload.js';
import { uploadRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * POST /api/settlements/upload
 * Upload settlements from CSV or JSON file
 * Rate limited: max 5 requests per minute
 */
router.post(
  '/upload',
  uploadRateLimiter,
  upload.single('file'),
  handleUploadError,
  uploadSettlements
);

/**
 * GET /api/settlements
 * List all settlements with optional status filter
 * Query params: ?status=MATCHED|DISCREPANCY|PENDING_REVIEW&page=1&limit=50
 */
router.get('/', listSettlements);

/**
 * GET /api/settlements/:awbNumber
 * Get single settlement detail by AWB number
 */
router.get('/:awbNumber', getSettlementByAwb);

export default router;
