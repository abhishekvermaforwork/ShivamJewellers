import Decimal from 'decimal.js';

/**
 * @param {{ metalType?: string }} category
 * @param {{ category?: { metalType?: string } }} inventoryItem
 */
export function resolveMetalType(category, inventoryItem) {
  try {
    if (category?.metalType) return category.metalType;
    if (inventoryItem?.category?.metalType) return inventoryItem.category.metalType;
  } catch {
    /* ignore */
  }
  return 'gold';
}

/**
 * Match Django LineItem.save() pricing (gold ₹/g, silver ₹/10g).
 * @param {object} line - line fields (weight, rate, makingChargeType, makingChargePct, makingChargeAmt)
 * @param {object|null} category
 * @param {object|null} inventoryItem - may include populated category
 */
export function computeLineTotal(line, category, inventoryItem) {
  const w = new Decimal(line.weight ?? 0);
  const r = new Decimal(line.rate ?? 0);
  const metal = resolveMetalType(category, inventoryItem);
  const baseValue =
    metal === 'silver' ? w.div(10).mul(r) : w.mul(r);

  let making = new Decimal(0);
  if (line.makingChargeType === 'amt' && line.makingChargeAmt != null) {
    making = new Decimal(line.makingChargeAmt);
  } else if (line.makingChargePct != null && line.makingChargePct !== '') {
    making = baseValue.mul(new Decimal(line.makingChargePct)).div(100);
  }

  return baseValue.plus(making).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

/**
 * Match Django Invoice.calculate_totals() when pk exists (line items loaded).
 * @param {object} invoice - invoice fields with cgstRate, sgstRate, discountAmount, etc.
 * @param {Array<{ lineTotal: number }>} lineItems
 */
export function calculateInvoiceTotals(invoice, lineItems) {
  const subtotal = lineItems.reduce(
    (acc, li) => acc.plus(new Decimal(li.lineTotal ?? 0)),
    new Decimal(0),
  );
  const cgstAmount = subtotal.mul(new Decimal(invoice.cgstRate ?? 0)).div(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const sgstAmount = subtotal.mul(new Decimal(invoice.sgstRate ?? 0)).div(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const deductions = new Decimal(invoice.discountAmount ?? 0)
    .plus(new Decimal(invoice.cashReceived ?? 0))
    .plus(new Decimal(invoice.swapAmount ?? 0))
    .plus(new Decimal(invoice.oldGoldAmount ?? 0));

  const total = Decimal.max(
    subtotal.plus(cgstAmount).plus(sgstAmount).minus(deductions),
    new Decimal(0),
  );

  return {
    subtotal: subtotal.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
    cgstAmount: cgstAmount.toNumber(),
    sgstAmount: sgstAmount.toNumber(),
    total: total.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
  };
}
