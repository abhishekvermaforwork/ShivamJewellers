/**
 * Client-side totals — mirrors backend invoiceCalculation.service.js (gold ₹/g, silver ₹/10g).
 */

export type Metal = 'gold' | 'silver';

export function resolveMetalType(
  category: { metalType?: Metal } | null | undefined,
  inventoryItem: { category?: { metalType?: Metal } } | null | undefined,
): Metal {
  if (category?.metalType) return category.metalType;
  if (inventoryItem?.category?.metalType) return inventoryItem.category.metalType;
  return 'gold';
}

export type LineCalcInput = {
  weight?: number | null;
  rate?: number | null;
  makingChargeType?: 'pct' | 'amt';
  makingChargePct?: number | null;
  makingChargeAmt?: number | null;
};

export function computeLineTotal(
  line: LineCalcInput,
  metal: Metal,
): number {
  const w = Number(line.weight ?? 0);
  const r = Number(line.rate ?? 0);
  const baseValue = metal === 'silver' ? (w / 10) * r : w * r;
  let making = 0;
  if (line.makingChargeType === 'amt' && line.makingChargeAmt != null) {
    making = Number(line.makingChargeAmt);
  } else if (line.makingChargePct != null && line.makingChargePct !== ('' as unknown)) {
    making = baseValue * (Number(line.makingChargePct) / 100);
  }
  return Math.round((baseValue + making) * 100) / 100;
}

export function calculateInvoiceTotals(
  invoice: {
    cgstRate?: number;
    sgstRate?: number;
    discountAmount?: number;
    cashReceived?: number;
    swapAmount?: number;
    oldGoldAmount?: number;
  },
  lineTotals: number[],
) {
  const subtotal = lineTotals.reduce((s, x) => s + x, 0);
  const cgst = (subtotal * Number(invoice.cgstRate ?? 0)) / 100;
  const sgst = (subtotal * Number(invoice.sgstRate ?? 0)) / 100;
  const deductions =
    Number(invoice.discountAmount ?? 0) +
    Number(invoice.cashReceived ?? 0) +
    Number(invoice.swapAmount ?? 0) +
    Number(invoice.oldGoldAmount ?? 0);
  const total = Math.max(0, Math.round((subtotal + cgst + sgst - deductions) * 100) / 100);
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    cgstAmount: Math.round(cgst * 100) / 100,
    sgstAmount: Math.round(sgst * 100) / 100,
    taxAmount: Math.round((cgst + sgst) * 100) / 100,
    total,
  };
}
