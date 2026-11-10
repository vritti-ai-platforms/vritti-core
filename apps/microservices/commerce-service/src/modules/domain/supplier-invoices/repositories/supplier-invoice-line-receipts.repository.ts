import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, eq, inArray, isNull, ne, notExists, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  GoodsReceiptStatusValues,
  goodsReceiptItems,
  goodsReceiptLines,
  goodsReceiptLots,
  goodsReceipts,
  type NewSupplierInvoiceLineReceipt,
  purchaseOrderItems,
  SupplierInvoiceStatusValues,
  supplierInvoiceLineReceipts,
  supplierInvoiceLines,
  supplierInvoices,
} from '@/db/schema';

export type UnbilledReceipt = {
  goodsReceiptItemId: string;
  goodsReceiptLotId: string | null;
  unbilledQty: number;
};

export type SupplierInvoiceLineReceiptRow = {
  supplierInvoiceLineId: string;
  goodsReceiptId: string;
  grNumber: string;
  lotNumber: string | null;
  quantity: number;
};

export type ReceivedLot = {
  purchaseOrderItemId: string;
  lotNumber: string;
  expiryDate: string;
  mrp: bigint | null;
};

@Injectable()
export class SupplierInvoiceLineReceiptsDomainRepository extends PrimaryBaseRepository<
  typeof supplierInvoiceLineReceipts
> {
  constructor(database: PrimaryDatabaseService) {
    super(database, supplierInvoiceLineReceipts);
  }

  // Sums what the other lines of live invoices already bill against the receipts the condition matches
  private billedByOtherLines(receiptMatch: SQL, excludeLineId: string) {
    return sql`(${this.db
      .select({ total: sql`coalesce(sum(${supplierInvoiceLineReceipts.quantity}), 0)` })
      .from(supplierInvoiceLineReceipts)
      .innerJoin(supplierInvoiceLines, eq(supplierInvoiceLines.id, supplierInvoiceLineReceipts.supplierInvoiceLineId))
      .innerJoin(supplierInvoices, eq(supplierInvoices.id, supplierInvoiceLines.supplierInvoiceId))
      .where(
        and(
          receiptMatch,
          ne(supplierInvoices.status, SupplierInvoiceStatusValues.CANCELLED),
          ne(supplierInvoiceLineReceipts.supplierInvoiceLineId, excludeLineId),
        ),
      )})`;
  }

  // Sums the accepted quantity the goods receipt lines matching the condition put away
  private receivedOnLines(lineMatch: SQL) {
    return sql`(${this.db
      .select({ total: sql`coalesce(sum(${goodsReceiptLines.quantity}), 0)` })
      .from(goodsReceiptLines)
      .where(lineMatch)})`;
  }

  // Returns the published receipt lots of an order line with the batch, oldest first, with what is still unbilled
  async findUnbilledLots(
    excludeLineId: string,
    purchaseOrderItemId: string,
    lotNumber: string,
  ): Promise<UnbilledReceipt[]> {
    const received = this.receivedOnLines(eq(goodsReceiptLines.goodsReceiptLotId, goodsReceiptLots.id));
    const billed = this.billedByOtherLines(
      eq(supplierInvoiceLineReceipts.goodsReceiptLotId, goodsReceiptLots.id),
      excludeLineId,
    );
    return this.db
      .select({
        goodsReceiptItemId: goodsReceiptItems.id,
        goodsReceiptLotId: goodsReceiptLots.id,
        unbilledQty: sql<number>`${received} - ${billed}`.mapWith(Number),
      })
      .from(goodsReceiptLots)
      .innerJoin(goodsReceiptItems, eq(goodsReceiptItems.id, goodsReceiptLots.goodsReceiptItemId))
      .innerJoin(goodsReceipts, eq(goodsReceipts.id, goodsReceiptItems.goodsReceiptId))
      .where(
        and(
          eq(goodsReceiptItems.purchaseOrderItemId, purchaseOrderItemId),
          eq(goodsReceipts.status, GoodsReceiptStatusValues.PUBLISHED),
          eq(goodsReceiptLots.lotNumber, lotNumber),
        ),
      )
      .orderBy(asc(goodsReceipts.publishedAt), asc(goodsReceipts.grNumber));
  }

  // Returns the published receipt items of an order line that carry no batches, oldest first, with what is still unbilled
  async findUnbilledItems(excludeLineId: string, purchaseOrderItemId: string): Promise<UnbilledReceipt[]> {
    const received = this.receivedOnLines(eq(goodsReceiptLines.goodsReceiptItemId, goodsReceiptItems.id));
    const billed = this.billedByOtherLines(
      and(
        eq(supplierInvoiceLineReceipts.goodsReceiptItemId, goodsReceiptItems.id),
        isNull(supplierInvoiceLineReceipts.goodsReceiptLotId),
      ) as SQL,
      excludeLineId,
    );
    const anyLot = this.db
      .select({ id: goodsReceiptLots.id })
      .from(goodsReceiptLots)
      .where(eq(goodsReceiptLots.goodsReceiptItemId, goodsReceiptItems.id));
    return this.db
      .select({
        goodsReceiptItemId: goodsReceiptItems.id,
        goodsReceiptLotId: sql<string | null>`null`,
        unbilledQty: sql<number>`${received} - ${billed}`.mapWith(Number),
      })
      .from(goodsReceiptItems)
      .innerJoin(goodsReceipts, eq(goodsReceipts.id, goodsReceiptItems.goodsReceiptId))
      .where(
        and(
          eq(goodsReceiptItems.purchaseOrderItemId, purchaseOrderItemId),
          eq(goodsReceipts.status, GoodsReceiptStatusValues.PUBLISHED),
          notExists(anyLot),
        ),
      )
      .orderBy(asc(goodsReceipts.publishedAt), asc(goodsReceipts.grNumber));
  }

  // Replaces a line's links to received stock with the given ones
  async replaceForLine(supplierInvoiceLineId: string, receipts: NewSupplierInvoiceLineReceipt[]): Promise<void> {
    await this.deleteMany(eq(supplierInvoiceLineReceipts.supplierInvoiceLineId, supplierInvoiceLineId));
    if (receipts.length === 0) return;
    await this.db.insert(supplierInvoiceLineReceipts).values(receipts);
  }

  // Returns the receipts the lines are linked to, with the goods receipt number and batch
  async findByLineIds(supplierInvoiceLineIds: string[]): Promise<SupplierInvoiceLineReceiptRow[]> {
    if (supplierInvoiceLineIds.length === 0) return [];
    return this.db
      .select({
        supplierInvoiceLineId: supplierInvoiceLineReceipts.supplierInvoiceLineId,
        goodsReceiptId: goodsReceipts.id,
        grNumber: goodsReceipts.grNumber,
        lotNumber: goodsReceiptLots.lotNumber,
        quantity: supplierInvoiceLineReceipts.quantity,
      })
      .from(supplierInvoiceLineReceipts)
      .innerJoin(goodsReceiptItems, eq(goodsReceiptItems.id, supplierInvoiceLineReceipts.goodsReceiptItemId))
      .innerJoin(goodsReceipts, eq(goodsReceipts.id, goodsReceiptItems.goodsReceiptId))
      .leftJoin(goodsReceiptLots, eq(goodsReceiptLots.id, supplierInvoiceLineReceipts.goodsReceiptLotId))
      .where(inArray(supplierInvoiceLineReceipts.supplierInvoiceLineId, supplierInvoiceLineIds))
      .orderBy(asc(goodsReceipts.publishedAt), asc(goodsReceipts.grNumber));
  }

  // Returns the batches received on a purchase order's published goods receipts, with the expiry date as received
  async findReceivedLots(purchaseOrderId: string): Promise<ReceivedLot[]> {
    return this.db
      .select({
        purchaseOrderItemId: goodsReceiptItems.purchaseOrderItemId,
        lotNumber: goodsReceiptLots.lotNumber,
        expiryDate: sql<string>`to_char(${goodsReceiptLots.expiryDate} at time zone 'UTC', 'YYYY-MM-DD')`,
        mrp: goodsReceiptLots.mrp,
      })
      .from(goodsReceiptLots)
      .innerJoin(goodsReceiptItems, eq(goodsReceiptItems.id, goodsReceiptLots.goodsReceiptItemId))
      .innerJoin(goodsReceipts, eq(goodsReceipts.id, goodsReceiptItems.goodsReceiptId))
      .innerJoin(purchaseOrderItems, eq(purchaseOrderItems.id, goodsReceiptItems.purchaseOrderItemId))
      .where(
        and(
          eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId),
          eq(goodsReceipts.status, GoodsReceiptStatusValues.PUBLISHED),
        ),
      );
  }
}
