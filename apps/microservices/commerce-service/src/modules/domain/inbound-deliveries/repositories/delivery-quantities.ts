import type { TypedDrizzleClient } from '@vritti/api-sdk/database';
import { type AnyColumn, aliasedTable, and, eq, notInArray, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  GoodsReceiptStatusValues,
  goodsReceiptItems,
  goodsReceipts,
  InboundDeliveryStatusValues,
  inboundDeliveries,
  inboundDeliveryLines,
  purchaseOrderItems,
} from '@/db/schema';

const liveLines = aliasedTable(inboundDeliveryLines, 'live_delivery_lines');
const liveDeliveries = aliasedTable(inboundDeliveries, 'live_deliveries');

// Sums what published goods receipts against a delivery accepted (received less rejected) of one PO line
export function receivedAgainstDelivery(
  db: TypedDrizzleClient,
  inboundDeliveryId: AnyColumn | SQL,
  purchaseOrderItemId: AnyColumn | SQL,
): SQL<number> {
  const accepted = db
    .select({
      total: sql`coalesce(sum(${goodsReceiptItems.receivedQty} - ${goodsReceiptItems.rejectedQuantity}), 0)`,
    })
    .from(goodsReceiptItems)
    .innerJoin(goodsReceipts, eq(goodsReceipts.id, goodsReceiptItems.goodsReceiptId))
    .where(
      and(
        eq(goodsReceipts.inboundDeliveryId, inboundDeliveryId),
        eq(goodsReceiptItems.purchaseOrderItemId, purchaseOrderItemId),
        eq(goodsReceipts.status, GoodsReceiptStatusValues.PUBLISHED),
      ),
    );
  return sql<number>`(${accepted})`;
}

// What of the outer query's PO line is still free to announce: ordered + free, less accepted, less still expected on deliveries not yet closed
export function remainingToDeliver(db: TypedDrizzleClient): SQL<number> {
  const received = receivedAgainstDelivery(db, liveLines.inboundDeliveryId, liveLines.purchaseOrderItemId);
  const outstanding = db
    .select({ total: sql`coalesce(sum(greatest(${liveLines.quantity} - ${received}, 0)), 0)` })
    .from(liveLines)
    .innerJoin(liveDeliveries, eq(liveDeliveries.id, liveLines.inboundDeliveryId))
    .where(
      and(
        eq(liveLines.purchaseOrderItemId, purchaseOrderItems.id),
        notInArray(liveDeliveries.status, [
          InboundDeliveryStatusValues.CANCELLED,
          InboundDeliveryStatusValues.RECEIVED,
        ]),
      ),
    );
  return sql<number>`(${purchaseOrderItems.uomQty} + ${purchaseOrderItems.freeQty} - ${purchaseOrderItems.receivedQuantity} - (${outstanding}))`;
}
