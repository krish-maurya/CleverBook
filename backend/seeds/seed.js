import 'dotenv/config';
import mongoose from 'mongoose';
import { Order, Settlement } from '../models/index.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cleverbooks';

const COURIERS = ['shiprocket', 'delhivery', 'bluedart', 'dtdc', 'kwikship'];
const STATUSES = ['DELIVERED', 'RTO', 'IN_TRANSIT', 'LOST'];
const MERCHANTS = ['MERCH-001', 'MERCH-002', 'MERCH-003', 'MERCH-004', 'MERCH-005'];

/**
 * Generate random AWB number
 */
function generateAwb(index) {
  return `AWB${String(index).padStart(8, '0')}`;
}

/**
 * Generate random date within range
 */
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

/**
 * Generate random number within range
 */
function randomNumber(min, max, decimals = 2) {
  const num = Math.random() * (max - min) + min;
  return Number(num.toFixed(decimals));
}

/**
 * Generate 50 mock orders
 */
function generateOrders() {
  const orders = [];
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

  for (let i = 1; i <= 50; i++) {
    const orderDate = randomDate(thirtyDaysAgo, now);
    const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
    
    // Only delivered orders get a delivery date
    let deliveryDate = null;
    if (status === 'DELIVERED') {
      // Delivery date is 2-5 days after order date
      const deliveryDelay = (2 + Math.floor(Math.random() * 4)) * 24 * 60 * 60 * 1000;
      deliveryDate = new Date(orderDate.getTime() + deliveryDelay);
    }

    // Special case: Order 45 will have overdue remittance (delivered 15+ days ago)
    if (i === 45) {
      orders.push({
        awbNumber: generateAwb(i),
        merchantId: MERCHANTS[i % MERCHANTS.length],
        courierPartner: COURIERS[i % COURIERS.length],
        orderStatus: 'DELIVERED',
        codAmount: randomNumber(500, 5000),
        declaredWeight: randomNumber(0.5, 10),
        orderDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        deliveryDate: fifteenDaysAgo // 15 days ago
      });
      continue;
    }

    orders.push({
      awbNumber: generateAwb(i),
      merchantId: MERCHANTS[i % MERCHANTS.length],
      courierPartner: COURIERS[i % COURIERS.length],
      orderStatus: status,
      codAmount: randomNumber(500, 5000),
      declaredWeight: randomNumber(0.5, 10),
      orderDate,
      deliveryDate
    });
  }

  return orders;
}

/**
 * Generate settlement records with intentional discrepancies
 */
function generateSettlements(orders) {
  const settlements = [];
  const batchId = 'BATCH-001';
  const now = new Date();

  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    
    // Base settlement data
    const settlement = {
      awbNumber: order.awbNumber,
      settledCodAmount: order.codAmount,
      chargedWeight: order.declaredWeight,
      forwardCharge: randomNumber(50, 200),
      rtoCharge: 0,
      codHandlingFee: randomNumber(10, 50),
      settlementDate: order.deliveryDate ? new Date(order.deliveryDate.getTime() + 7 * 24 * 60 * 60 * 1000) : null,
      batchId,
      status: 'PENDING_REVIEW'
    };

    // === Intentional Discrepancies ===

    // COD Short-remittance (orders 5 and 10)
    if (i === 4 || i === 9) {
      // Settle significantly less than COD amount
      settlement.settledCodAmount = order.codAmount * 0.85; // 15% less
      console.log(`[Seed] Order ${order.awbNumber}: COD short-remittance (expected: ${order.codAmount}, settled: ${settlement.settledCodAmount.toFixed(2)})`);
    }

    // Weight Dispute (orders 15 and 20)
    if (i === 14 || i === 19) {
      // Charge weight significantly higher than declared
      settlement.chargedWeight = order.declaredWeight * 1.5; // 50% more
      console.log(`[Seed] Order ${order.awbNumber}: Weight dispute (declared: ${order.declaredWeight}kg, charged: ${settlement.chargedWeight.toFixed(2)}kg)`);
    }

    // Phantom RTO Charge (orders 25 and 30 - must be DELIVERED)
    if ((i === 24 || i === 29) && order.orderStatus === 'DELIVERED') {
      settlement.rtoCharge = randomNumber(100, 300);
      console.log(`[Seed] Order ${order.awbNumber}: Phantom RTO charge (status: DELIVERED, rtoCharge: ${settlement.rtoCharge})`);
    }
    // Ensure we have phantom RTO charges by modifying specific delivered orders
    if (i === 2 || i === 7) {
      // Make sure these are delivered and have RTO charges
      orders[i].orderStatus = 'DELIVERED';
      orders[i].deliveryDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
      settlement.rtoCharge = randomNumber(100, 300);
      settlement.settlementDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      console.log(`[Seed] Order ${order.awbNumber}: Phantom RTO charge (status: DELIVERED, rtoCharge: ${settlement.rtoCharge})`);
    }

    // Overdue Remittance (order 45) - already set in orders, just remove settlement date
    if (i === 44) {
      settlement.settlementDate = null;
      console.log(`[Seed] Order ${order.awbNumber}: Overdue remittance (delivered 15+ days ago, no settlement)`);
    }

    // Duplicate Settlement (order 35) - will be added twice
    if (i === 34) {
      console.log(`[Seed] Order ${order.awbNumber}: Will be duplicated in BATCH-002`);
    }

    settlements.push(settlement);
  }

  // Add duplicate settlement (order 35 in a different batch)
  const duplicateOrder = orders[34];
  settlements.push({
    awbNumber: duplicateOrder.awbNumber,
    settledCodAmount: duplicateOrder.codAmount * 0.95, // Slightly different amount
    chargedWeight: duplicateOrder.declaredWeight,
    forwardCharge: randomNumber(50, 200),
    rtoCharge: 0,
    codHandlingFee: randomNumber(10, 50),
    settlementDate: new Date(),
    batchId: 'BATCH-002', // Different batch
    status: 'PENDING_REVIEW'
  });
  console.log(`[Seed] Order ${duplicateOrder.awbNumber}: Duplicate in BATCH-002`);

  return settlements;
}

/**
 * Main seed function
 */
async function seed() {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('[Seed] Connected to MongoDB');

    // Clear existing data
    console.log('[Seed] Clearing existing data...');
    await Order.deleteMany({});
    await Settlement.deleteMany({});
    console.log('[Seed] Existing data cleared');

    // Generate and insert orders
    console.log('[Seed] Generating 50 mock orders...');
    const orders = generateOrders();
    await Order.insertMany(orders);
    console.log(`[Seed] Inserted ${orders.length} orders`);

    // Generate and insert settlements
    console.log('[Seed] Generating settlements with intentional discrepancies...');
    const settlements = generateSettlements(orders);
    await Settlement.insertMany(settlements);
    console.log(`[Seed] Inserted ${settlements.length} settlements`);

    // Summary
    console.log('\n[Seed] ========== SEED SUMMARY ==========');
    console.log('[Seed] Total Orders: 50');
    console.log('[Seed] Total Settlements: 51 (including 1 duplicate)');
    console.log('[Seed] Intentional Discrepancies:');
    console.log('  - 2 COD Short-remittance cases (AWB00000005, AWB00000010)');
    console.log('  - 2 Weight Disputes (AWB00000015, AWB00000020)');
    console.log('  - 2 Phantom RTO Charges (AWB00000003, AWB00000008)');
    console.log('  - 1 Overdue Remittance (AWB00000045)');
    console.log('  - 1 Duplicate Settlement (AWB00000035 in BATCH-001 and BATCH-002)');
    console.log('[Seed] =====================================\n');

    console.log('[Seed] Seed completed successfully!');
    console.log('[Seed] Run reconciliation to detect discrepancies: POST /api/jobs/trigger');

  } catch (err) {
    console.error('[Seed] Error:', err);
  } finally {
    await mongoose.connection.close();
    console.log('[Seed] MongoDB connection closed');
  }
}

seed();
