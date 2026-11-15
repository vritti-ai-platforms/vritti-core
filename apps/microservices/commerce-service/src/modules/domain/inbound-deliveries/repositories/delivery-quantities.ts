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

// Sums what posted goods receipts accepted (received less rejected, in primary units) against one delivery line
export function acceptedOnDeliveryLine(db: TypedDrizzleClient, inboundDeliveryLineId: AnyColumn | SQL): SQL<number> {
  const accepted = db
    .select({
      total: sql`coalesce(sum(${goodsReceiptItems.receivedPrimaryQty} - ${goodsReceiptItems.rejectedPrimaryQty}), 0)`,
    })
    .from(goodsReceiptItems)
    .innerJoin(goodsReceipts, eq(goodsReceipts.id, goodsReceiptItems.goodsReceiptId))
    .where(
      and(
        eq(goodsReceiptItems.inboundDeliveryLineId, inboundDeliveryLineId),
        eq(goodsReceipts.status, GoodsReceiptStatusValues.POSTED),
      ),
    );
  return sql<number>`(${accepted})`;
}

// What of the outer query's PO line is still free to put on an inbound delivery, in primary units: ordered + free − cancelled, less
// received, less still expected on deliveries not yet closed
export function remainingToDeliver(db: TypedDrizzleClient): SQL<number> {
  const accepted = acceptedOnDeliveryLine(db, liveLines.id);
  const outstanding = db
    .select({ total: sql`coalesce(sum(greatest(${liveLines.primaryUomQty} - ${accepted}, 0)), 0)` })
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
  return sql<number>`(${purchaseOrderItems.primaryUomQty} + ${purchaseOrderItems.freePrimaryQty} - ${purchaseOrderItems.cancelledPrimaryQty} - ${purchaseOrderItems.receivedPrimaryQty} - (${outstanding}))`;
}
