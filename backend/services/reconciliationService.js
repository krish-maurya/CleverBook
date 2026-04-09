import { Settlement, Order, Job, Notification } from '../models/index.js';
import { applyAllRules, createDuplicateSettlementDiscrepancy } from '../utils/discrepancyRules.js';
import { generateNotificationIdempotencyKey } from '../utils/idempotency.js';
import { addNotificationJob } from '../queues/notificationQueue.js';

/**
 * Main reconciliation service
 * Processes all PENDING_REVIEW settlements and applies discrepancy rules
 */
export async function runReconciliation() {
  const startTime = Date.now();
  
  // Create job record
  const job = new Job({
    runAt: new Date(),
    status: 'RUNNING',
    totalProcessed: 0,
    discrepanciesFound: 0,
    errors: []
  });
  await job.save();
  
  console.log(`[Reconciliation] Job ${job._id} started at ${job.runAt.toISOString()}`);

  try {
    // Step 1: Check for duplicate settlements (Rule 5)
    await checkDuplicateSettlements(job);
    
    // Step 2: Process all PENDING_REVIEW settlements
    const pendingSettlements = await Settlement.find({ status: 'PENDING_REVIEW' });
    console.log(`[Reconciliation] Found ${pendingSettlements.length} pending settlements to process`);

    for (const settlement of pendingSettlements) {
      try {
        await processSettlement(settlement, job);
        job.totalProcessed++;
      } catch (err) {
        console.error(`[Reconciliation] Error processing AWB ${settlement.awbNumber}:`, err.message);
        job.errors.push(`AWB ${settlement.awbNumber}: ${err.message}`);
      }
    }

    // Mark job as completed
    job.status = 'COMPLETED';
    job.completedAt = new Date();
    job.duration = Date.now() - startTime;
    await job.save();

    console.log(`[Reconciliation] Job ${job._id} completed. Processed: ${job.totalProcessed}, Discrepancies: ${job.discrepanciesFound}`);

    return {
      jobId: job._id,
      status: job.status,
      totalProcessed: job.totalProcessed,
      discrepanciesFound: job.discrepanciesFound,
      duration: job.duration
    };

  } catch (err) {
    console.error('[Reconciliation] Job failed:', err);
    job.status = 'FAILED';
    job.errors.push(err.message);
    job.completedAt = new Date();
    job.duration = Date.now() - startTime;
    await job.save();
    throw err;
  }
}

/**
 * Process a single settlement against its order
 */
async function processSettlement(settlement, job) {
  // Find corresponding order
  const order = await Order.findOne({ awbNumber: settlement.awbNumber });

  if (!order) {
    console.log(`[Reconciliation] No order found for AWB ${settlement.awbNumber}, skipping rules`);
    settlement.status = 'PENDING_REVIEW';
    settlement.discrepancyDetails = { error: 'No matching order found' };
    await settlement.save();
    return;
  }

  // Apply all discrepancy rules
  const discrepancies = applyAllRules(settlement, order);

  if (discrepancies.length > 0) {
    // Mark as discrepancy
    settlement.status = 'DISCREPANCY';
    settlement.discrepancyType = discrepancies.map(d => d.type);
    settlement.discrepancyDetails = {
      rules: discrepancies.map(d => ({
        type: d.type,
        details: d.details,
        suggestedAction: d.suggestedAction
      }))
    };

    job.discrepanciesFound++;

    // Queue notifications for each discrepancy (pub-sub pattern)
    for (const discrepancy of discrepancies) {
      await queueDiscrepancyNotification(settlement, order, discrepancy);
    }

    console.log(`[Reconciliation] AWB ${settlement.awbNumber}: ${discrepancies.length} discrepancies found`);
  } else {
    // No discrepancies - mark as matched
    settlement.status = 'MATCHED';
    settlement.discrepancyType = [];
    settlement.discrepancyDetails = {};
    console.log(`[Reconciliation] AWB ${settlement.awbNumber}: MATCHED`);
  }

  await settlement.save();
}

/**
 * Check for duplicate settlements (Rule 5)
 * Same AWB appearing in multiple batches
 */
async function checkDuplicateSettlements(job) {
  console.log('[Reconciliation] Checking for duplicate settlements...');

  const duplicates = await Settlement.aggregate([
    {
      $group: {
        _id: '$awbNumber',
        batchIds: { $addToSet: '$batchId' },
        count: { $sum: 1 }
      }
    },
    {
      $match: {
        count: { $gt: 1 }
      }
    }
  ]);

  console.log(`[Reconciliation] Found ${duplicates.length} AWBs with duplicate settlements`);

  for (const dup of duplicates) {
    const discrepancy = createDuplicateSettlementDiscrepancy(dup._id, dup.batchIds);

    // Update all settlements for this AWB
    await Settlement.updateMany(
      { awbNumber: dup._id },
      {
        $addToSet: { discrepancyType: 'DUPLICATE_SETTLEMENT' },
        $set: {
          status: 'DISCREPANCY',
          'discrepancyDetails.duplicateInfo': discrepancy.details
        }
      }
    );

    // Get order info for notification
    const order = await Order.findOne({ awbNumber: dup._id });
    if (order) {
      const settlement = await Settlement.findOne({ awbNumber: dup._id });
      await queueDiscrepancyNotification(settlement, order, discrepancy);
    }

    job.discrepanciesFound++;
  }
}

/**
 * Queue a notification for a discrepancy via Bull queue
 * Does NOT send directly - follows pub-sub pattern
 */
async function queueDiscrepancyNotification(settlement, order, discrepancy) {
  const idempotencyKey = generateNotificationIdempotencyKey(
    settlement.awbNumber,
    settlement.batchId,
    discrepancy.type
  );

  // Check if notification already exists (idempotency)
  const existingNotification = await Notification.findOne({ idempotencyKey });
  if (existingNotification) {
    console.log(`[Reconciliation] Notification already exists for ${idempotencyKey}, skipping`);
    return;
  }

  // Determine expected and actual values based on discrepancy type
  let expectedValue = 0;
  let actualValue = 0;

  switch (discrepancy.type) {
    case 'COD_SHORT_REMITTANCE':
      expectedValue = discrepancy.details.expectedMinimum;
      actualValue = discrepancy.details.actual;
      break;
    case 'WEIGHT_DISPUTE':
      expectedValue = discrepancy.details.declaredWeight;
      actualValue = discrepancy.details.chargedWeight;
      break;
    case 'PHANTOM_RTO_CHARGE':
      expectedValue = 0;
      actualValue = discrepancy.details.rtoCharge;
      break;
    case 'OVERDUE_REMITTANCE':
      expectedValue = discrepancy.details.expectedCodAmount;
      actualValue = 0;
      break;
    case 'DUPLICATE_SETTLEMENT':
      expectedValue = 1;
      actualValue = discrepancy.details.duplicateCount;
      break;
  }

  // Create notification record
  const notification = new Notification({
    merchantId: order.merchantId,
    awbNumber: settlement.awbNumber,
    discrepancyType: discrepancy.type,
    expectedValue,
    actualValue,
    suggestedAction: discrepancy.suggestedAction,
    status: 'PENDING',
    idempotencyKey
  });
  await notification.save();

  // Add to Bull queue for async processing
  await addNotificationJob({
    notificationId: notification._id.toString(),
    merchantId: order.merchantId,
    awbNumber: settlement.awbNumber,
    discrepancyType: discrepancy.type,
    expectedValue,
    actualValue,
    suggestedAction: discrepancy.suggestedAction,
    idempotencyKey
  });

  console.log(`[Reconciliation] Queued notification for AWB ${settlement.awbNumber}, type: ${discrepancy.type}`);
}

export default {
  runReconciliation
};
