import { InventoryItem } from '../models/InventoryItem.model.js';
import { LineItem } from '../models/LineItem.model.js';

/**
 * Piece-based lines: mark linked inventory items as sold (Django mark_items_sold).
 */
export async function markItemsSold(invoice) {
  const lines = await LineItem.find({ invoice: invoice._id, lineType: 'piece' })
    .populate({ path: 'inventoryItem', select: 'status weight' });

  for (const line of lines) {
    const item = line.inventoryItem;
    if (!item || item.status !== 'in_stock') continue;
    item.status = 'sold';
    item.weightAtSale = line.weight != null ? line.weight : item.weight;
    item.dateSold = invoice.issueDate ? new Date(invoice.issueDate) : new Date();
    item.dateSold.setUTCHours(0, 0, 0, 0);
    item.invoice = invoice._id;
    await item.save();
  }
}

/** Django restore_items_to_stock */
export async function restoreItemsToStock(invoiceId) {
  await InventoryItem.updateMany(
    { invoice: invoiceId },
    { $set: { status: 'in_stock', weightAtSale: null, dateSold: null, invoice: null } },
  );
}
