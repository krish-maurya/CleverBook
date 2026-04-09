import { parse } from 'csv-parse/sync';
import { Settlement, Order } from '../models/index.js';
import { successResponse, errorResponse } from '../utils/response.js';

function normalizeKey(key) {
  return String(key || '')
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function normalizeRecord(record) {
  const normalized = {};

  for (const [rawKey, value] of Object.entries(record || {})) {
    normalized[normalizeKey(rawKey)] = value;
  }

  return normalized;
}

function pickValue(record, keys) {
  for (const key of keys) {
    const value = record[normalizeKey(key)];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }
  return null;
}

function parseNumeric(value, fallback = 0) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return fallback;
  }

  const cleaned = String(value).replace(/[₹,\s]/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Upload settlements from CSV or JSON file
 * POST /api/settlements/upload
 */
export async function uploadSettlements(req, res) {
  try {
    if (!req.file) {
      return errorResponse(res, 'No file uploaded', 400);
    }

    const fileContent = req.file.buffer.toString('utf-8');
    const fileName = req.file.originalname.toLowerCase();
    let records = [];

    // Parse file based on extension
    if (fileName.endsWith('.csv')) {
      records = parse(fileContent, {
        bom: true,
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
    } else if (fileName.endsWith('.json')) {
      const parsed = JSON.parse(fileContent);
      records = Array.isArray(parsed) ? parsed : [parsed];
    } else {
      return errorResponse(res, 'Unsupported file format. Use CSV or JSON.', 400);
    }

    // Validate row count
    if (records.length > 1000) {
      return errorResponse(res, 'Maximum 1000 rows allowed per upload', 400);
    }

    if (records.length === 0) {
      return errorResponse(res, 'File contains no valid records', 400);
    }

    const normalizedRecords = records.map((record) => normalizeRecord(record));

    // Extract batchId from first record or generate one
    const firstBatchId = pickValue(normalizedRecords[0], ['batchId', 'batch_id']);
    const batchId = firstBatchId || `BATCH-${Date.now()}`;

    const results = {
      processed: 0,
      skipped: 0,
      errors: []
    };

    // Process each record with idempotency check
    for (let i = 0; i < normalizedRecords.length; i++) {
      const record = normalizedRecords[i];
      try {
        const awbNumberRaw = pickValue(record, ['awbNumber', 'awb_number', 'awb', 'awbno', 'awb_no']);
        const awbNumber = awbNumberRaw ? String(awbNumberRaw).trim() : '';
        
        if (!awbNumber) {
          results.errors.push(`Row ${i + 1}: Missing awbNumber`);
          continue;
        }

        const settlementBatchId = String(
          pickValue(record, ['batchId', 'batch_id']) || batchId
        ).trim();

        // Check for existing settlement with same awbNumber and batchId (idempotency)
        const existing = await Settlement.findOne({ 
          awbNumber, 
          batchId: settlementBatchId 
        });

        if (existing) {
          results.skipped++;
          continue;
        }

        // Create new settlement
        const settlementDateRaw = pickValue(record, ['settlementDate', 'settlement_date']);
        const settlementDate = settlementDateRaw ? new Date(settlementDateRaw) : null;

        const settlement = new Settlement({
          awbNumber,
          settledCodAmount: parseNumeric(pickValue(record, ['settledCodAmount', 'settled_cod_amount', 'settledcodamount'])),
          chargedWeight: parseNumeric(pickValue(record, ['chargedWeight', 'charged_weight', 'chargedweight'])),
          forwardCharge: parseNumeric(pickValue(record, ['forwardCharge', 'forward_charge', 'forwardcharge'])),
          rtoCharge: parseNumeric(pickValue(record, ['rtoCharge', 'rto_charge', 'rtocharge'])),
          codHandlingFee: parseNumeric(pickValue(record, ['codHandlingFee', 'cod_handling_fee', 'codhandlingfee'])),
          settlementDate: settlementDate && !Number.isNaN(settlementDate.getTime()) ? settlementDate : null,
          batchId: settlementBatchId,
          status: 'PENDING_REVIEW'
        });

        await settlement.save();
        results.processed++;
      } catch (err) {
        results.errors.push(`Row ${i + 1}: Error processing record - ${err.message}`);
      }
    }

    if (results.processed === 0 && results.skipped === 0) {
      return errorResponse(
        res,
        'No records were stored. Please check file headers and values.',
        400,
        {
          batchId,
          ...results,
          total: records.length
        }
      );
    }

    if (results.processed === 0 && results.skipped > 0 && results.errors.length === 0) {
      return successResponse(
        res,
        {
          batchId,
          ...results,
          total: records.length
        },
        'Upload complete: all records were already present and skipped as duplicates'
      );
    }

    return successResponse(res, {
      batchId,
      ...results,
      total: records.length
    }, `Upload complete: ${results.processed} processed, ${results.skipped} skipped`);

  } catch (err) {
    console.error('[SettlementController] Upload error:', err);
    return errorResponse(res, `Upload failed: ${err.message}`, 500);
  }
}

/**
 * List all settlements with optional status filter
 * GET /api/settlements
 */
export async function listSettlements(req, res) {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (status && ['MATCHED', 'DISCREPANCY', 'PENDING_REVIEW'].includes(status)) {
      query.status = status;
    }

    const [settlements, total] = await Promise.all([
      Settlement.aggregate([
        { $match: query },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: parseInt(limit) },
        {
          $lookup: {
            from: 'orders',
            localField: 'awbNumber',
            foreignField: 'awbNumber',
            as: 'order'
          }
        },
        {
          $unwind: {
            path: '$order',
            preserveNullAndEmptyArrays: true
          }
        }
      ]),
      Settlement.countDocuments(query)
    ]);

    return successResponse(res, {
      settlements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }, 'Settlements retrieved successfully');

  } catch (err) {
    console.error('[SettlementController] List error:', err);
    return errorResponse(res, 'Failed to retrieve settlements', 500);
  }
}

/**
 * Get single settlement detail by AWB number
 * GET /api/settlements/:awbNumber
 */
export async function getSettlementByAwb(req, res) {
  try {
    const { awbNumber } = req.params;

    const settlement = await Settlement.findOne({ awbNumber }).lean();

    if (!settlement) {
      return errorResponse(res, 'Settlement not found', 404);
    }

    // Also fetch the corresponding order for context
    const order = await Order.findOne({ awbNumber }).lean();

    return successResponse(res, {
      settlement,
      order
    }, 'Settlement details retrieved');

  } catch (err) {
    console.error('[SettlementController] Get by AWB error:', err);
    return errorResponse(res, 'Failed to retrieve settlement', 500);
  }
}

export default {
  uploadSettlements,
  listSettlements,
  getSettlementByAwb
};
