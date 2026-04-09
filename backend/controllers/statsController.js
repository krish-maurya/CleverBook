import { Settlement, Order, Job, Notification } from '../models/index.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Get summary statistics
 * GET /api/stats
 */
export async function getStats(req, res) {
  try {
    // Get total discrepancy value
    const discrepancyAggregation = await Settlement.aggregate([
      { $match: { status: 'DISCREPANCY' } },
      {
        $lookup: {
          from: 'orders',
          localField: 'awbNumber',
          foreignField: 'awbNumber',
          as: 'order'
        }
      },
      { $unwind: { path: '$order', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          awbNumber: 1,
          discrepancyType: 1,
          codShortfall: {
            $cond: {
              if: { $in: ['COD_SHORT_REMITTANCE', '$discrepancyType'] },
              then: { $subtract: ['$order.codAmount', '$settledCodAmount'] },
              else: 0
            }
          },
          phantomRtoCharge: {
            $cond: {
              if: { $in: ['PHANTOM_RTO_CHARGE', '$discrepancyType'] },
              then: '$rtoCharge',
              else: 0
            }
          },
          courierPartner: '$order.courierPartner'
        }
      },
      {
        $group: {
          _id: '$courierPartner',
          totalCodShortfall: { $sum: '$codShortfall' },
          totalPhantomRtoCharges: { $sum: '$phantomRtoCharge' },
          discrepancyCount: { $sum: 1 }
        }
      }
    ]);

    // Get overall stats
    const [
      totalSettlements,
      matchedCount,
      discrepancyCount,
      pendingCount,
      totalOrders,
      courierPartners,
      recentJobs,
      notificationStats
    ] = await Promise.all([
      Settlement.countDocuments(),
      Settlement.countDocuments({ status: 'MATCHED' }),
      Settlement.countDocuments({ status: 'DISCREPANCY' }),
      Settlement.countDocuments({ status: 'PENDING_REVIEW' }),
      Order.countDocuments(),
      Order.distinct('courierPartner'),
      Job.find().sort({ runAt: -1 }).limit(5).lean(),
      Notification.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Calculate total discrepancy value
    const totalDiscrepancyValue = discrepancyAggregation.reduce((sum, item) => {
      return sum + (item.totalCodShortfall || 0) + (item.totalPhantomRtoCharges || 0);
    }, 0);

    // Courier-wise breakdown
    const courierBreakdown = {};

    // Ensure all courier partners appear in chart/list, even with zero discrepancies.
    for (const courier of courierPartners) {
      courierBreakdown[courier] = {
        discrepancyCount: 0,
        totalCodShortfall: 0,
        totalPhantomRtoCharges: 0,
        totalValue: 0
      };
    }

    for (const item of discrepancyAggregation) {
      if (item._id) {
        courierBreakdown[item._id] = {
          discrepancyCount: item.discrepancyCount,
          totalCodShortfall: item.totalCodShortfall || 0,
          totalPhantomRtoCharges: item.totalPhantomRtoCharges || 0,
          totalValue: (item.totalCodShortfall || 0) + (item.totalPhantomRtoCharges || 0)
        };
      }
    }

    // Discrepancy type breakdown
    const discrepancyTypeBreakdown = await Settlement.aggregate([
      { $match: { status: 'DISCREPANCY' } },
      { $unwind: '$discrepancyType' },
      {
        $group: {
          _id: '$discrepancyType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Format notification stats
    const notificationStatusMap = {};
    for (const stat of notificationStats) {
      notificationStatusMap[stat._id] = stat.count;
    }

    return successResponse(res, {
      summary: {
        totalSettlements,
        matched: matchedCount,
        discrepancies: discrepancyCount,
        pendingReview: pendingCount,
        totalOrders,
        totalDiscrepancyValueINR: Math.round(totalDiscrepancyValue * 100) / 100
      },
      courierBreakdown,
      discrepancyTypeBreakdown: discrepancyTypeBreakdown.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      notifications: notificationStatusMap,
      recentJobs: recentJobs.map(job => ({
        id: job._id,
        status: job.status,
        runAt: job.runAt,
        totalProcessed: job.totalProcessed,
        discrepanciesFound: job.discrepanciesFound
      }))
    }, 'Statistics retrieved successfully');

  } catch (err) {
    console.error('[StatsController] Error:', err);
    return errorResponse(res, 'Failed to retrieve statistics', 500);
  }
}

export default {
  getStats
};
