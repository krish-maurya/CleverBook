import crypto from 'crypto';

/**
 * Generate idempotency key for notifications
 * Combines awbNumber + batchId + discrepancyType
 */
export function generateNotificationIdempotencyKey(awbNumber, batchId, discrepancyType) {
  const data = `${awbNumber}:${batchId}:${discrepancyType}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
}

/**
 * Generate idempotency key for settlement upload
 * Combines awbNumber + batchId
 */
export function generateSettlementIdempotencyKey(awbNumber, batchId) {
  return `${awbNumber}:${batchId}`;
}

export default {
  generateNotificationIdempotencyKey,
  generateSettlementIdempotencyKey
};
