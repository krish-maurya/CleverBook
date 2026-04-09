/**
 * Discrepancy detection rules for settlement reconciliation
 */

/**
 * Rule 1: COD Short-remittance
 * If settledCodAmount < (codAmount - min(codAmount * 0.02, 10))
 */
export function checkCodShortRemittance(settlement, order) {
  const threshold = Math.min(order.codAmount * 0.02, 10);
  const minimumExpected = order.codAmount - threshold;
  
  if (settlement.settledCodAmount < minimumExpected) {
    return {
      type: 'COD_SHORT_REMITTANCE',
      details: {
        expectedMinimum: minimumExpected,
        actual: settlement.settledCodAmount,
        shortfall: minimumExpected - settlement.settledCodAmount,
        originalCodAmount: order.codAmount,
        threshold
      },
      suggestedAction: `Raise dispute for COD shortfall of INR ${(minimumExpected - settlement.settledCodAmount).toFixed(2)}`
    };
  }
  return null;
}

/**
 * Rule 2: Weight Dispute
 * If chargedWeight > declaredWeight * 1.10
 */
export function checkWeightDispute(settlement, order) {
  const maxAllowedWeight = order.declaredWeight * 1.10;
  
  if (settlement.chargedWeight > maxAllowedWeight) {
    return {
      type: 'WEIGHT_DISPUTE',
      details: {
        declaredWeight: order.declaredWeight,
        chargedWeight: settlement.chargedWeight,
        maxAllowed: maxAllowedWeight,
        overcharge: settlement.chargedWeight - order.declaredWeight
      },
      suggestedAction: `Dispute weight charge - billed ${settlement.chargedWeight}kg vs declared ${order.declaredWeight}kg`
    };
  }
  return null;
}

/**
 * Rule 3: Phantom RTO Charge
 * If rtoCharge > 0 AND orderStatus === "DELIVERED"
 */
export function checkPhantomRtoCharge(settlement, order) {
  if (settlement.rtoCharge > 0 && order.orderStatus === 'DELIVERED') {
    return {
      type: 'PHANTOM_RTO_CHARGE',
      details: {
        rtoCharge: settlement.rtoCharge,
        orderStatus: order.orderStatus
      },
      suggestedAction: `Claim refund for invalid RTO charge of INR ${settlement.rtoCharge} on delivered order`
    };
  }
  return null;
}

/**
 * Rule 4: Overdue Remittance
 * If deliveryDate is 14+ days ago AND no settlementDate
 */
export function checkOverdueRemittance(settlement, order) {
  if (!order.deliveryDate) return null;
  
  const daysSinceDelivery = Math.floor(
    (Date.now() - new Date(order.deliveryDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysSinceDelivery >= 14 && !settlement.settlementDate) {
    return {
      type: 'OVERDUE_REMITTANCE',
      details: {
        deliveryDate: order.deliveryDate,
        daysSinceDelivery,
        expectedCodAmount: order.codAmount
      },
      suggestedAction: `Follow up with courier - remittance overdue by ${daysSinceDelivery - 14} days`
    };
  }
  return null;
}

/**
 * Rule 5: Duplicate Settlement
 * Checked separately in reconciliation service
 */
export function createDuplicateSettlementDiscrepancy(awbNumber, batchIds) {
  return {
    type: 'DUPLICATE_SETTLEMENT',
    details: {
      awbNumber,
      batchIds,
      duplicateCount: batchIds.length
    },
    suggestedAction: `Investigate duplicate settlements across batches: ${batchIds.join(', ')}`
  };
}

/**
 * Apply all rules to a settlement-order pair
 */
export function applyAllRules(settlement, order) {
  const discrepancies = [];
  
  const rules = [
    checkCodShortRemittance,
    checkWeightDispute,
    checkPhantomRtoCharge,
    checkOverdueRemittance
  ];
  
  for (const rule of rules) {
    const result = rule(settlement, order);
    if (result) {
      discrepancies.push(result);
    }
  }
  
  return discrepancies;
}

export default {
  checkCodShortRemittance,
  checkWeightDispute,
  checkPhantomRtoCharge,
  checkOverdueRemittance,
  createDuplicateSettlementDiscrepancy,
  applyAllRules
};
