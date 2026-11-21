import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, eq, exists, getColumns, inArray, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import {
  GoodsReceiptStatusValues,
  goodsReceiptItems,
  goodsReceipts,
  inboundDeliveries,
  inboundDeliveryLines,
  type PurchaseOrder,
  type PurchaseOrderItem,
  parties,
  purchaseOrderItems,
  purchaseOrderNumberSeq,
  purchaseOrders,
  purchases,
  supplierInvoiceLines,
  supplierInvoices,
  suppliers,
} from '@/db/schema';

export type PurchaseOrderLineCounters = Pick<
  PurchaseOrderItem,
  | 'purchaseOrderId'
  | 'primaryUomQty'
  | 'freePrimaryQty'
  | 'receivedPrimaryQty'
  | 'invoicedPrimaryQty'
  | 'returnedPrimaryQty'
  | 'cancelledPrimaryQty'
>;

export type PurchaseOrderProgress = Pick<PurchaseOrder, 'id' | 'poNumber' | 'receiptStatus' | 'invoiceStatus'>;

export type PurchaseOrderCounts = {
  itemCount: number;
  inboundDeliveryCount: number;
  goodsReceiptCount: number;
  invoiceCount: number;
};

export type PurchaseOrderRow = PurchaseOrder & {
  supplierName: string | null;
  purchaseNumber: string | null;
  itemCount: number;
  hasPostedGoodsReceipt: boolean;
  latestExpectedDeliveryDate: string | null;
};

@Injectable()
export class PurchaseOrdersDomainRepository extends PrimaryBaseRepository<typeof purchaseOrders> {
  constructor(database: PrimaryDatabaseService) {
    super(database, purchaseOrders, { sequence: purchaseOrderNumberSeq });
  }

  // Generates the next sequential PO number for the current month
  async generatePoNumber(): Promise<string> {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const nextNumber = await this.nextSequenceValue();
    return `PO-${yearMonth}-${String(nextNumber).padStart(4, '0')}`;
  }

  // Loads a PO with its supplier name, line count and receipt state
  findDetail(id: string): Promise<PurchaseOrderRow | undefined> {
    return this.findById<PurchaseOrderRow>(id, {
      select: this.selection(),
      leftJoins: this.joins(),
    });
  }

  // Counts a PO's lines and the deliveries, receipts and invoices on them, throwing when it is out of reach
  async findCountsOrThrow(id: string): Promise<PurchaseOrderCounts> {
    const counts = await this.findById<PurchaseOrderCounts>(id, { select: this.counts() });
    if (!counts) throw new NotFoundException('Purchase order not found.');
    return counts;
  }

  // Returns the POs a purchase created, oldest first
  findForPurchase(purchaseId: string): Promise<PurchaseOrderRow[]> {
    return this.findAllWithSelect<PurchaseOrderRow>({
      select: this.selection(),
      leftJoins: this.joins(),
      where: eq(purchaseOrders.purchaseId, purchaseId),
      orderBy: [asc(purchaseOrders.createdAt)],
    });
  }

  // Returns one page of POs with their supplier names, line counts and receipt state
  async findForTable(options: {
    where?: SQL;
    orderBy: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: PurchaseOrderRow[]; count: number }> {
    return this.findAllAndCount<PurchaseOrderRow>({
      select: this.selection(),
      leftJoins: this.joins(),
      ...options,
    });
  }

  // Recalculates the PO total from the sum of its line totals
  async syncTotalAmount(id: string): Promise<void> {
    const lineTotals = this.db
      .select({ total: sql`coalesce(sum(${purchaseOrderItems.totalPrice}), 0)` })
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.purchaseOrderId, id));
    await this.db
      .update(purchaseOrders)
      .set({ totalAmount: sql`(${lineTotals})` })
      .where(eq(purchaseOrders.id, id));
  }

  // Returns the cached receipt and invoicing statuses of the given POs
  async findProgress(ids: string[]): Promise<PurchaseOrderProgress[]> {
    if (ids.length === 0) return [];
    return this.findAllWithSelect<PurchaseOrderProgress>({
      select: {
        id: purchaseOrders.id,
        poNumber: purchaseOrders.poNumber,
        receiptStatus: purchaseOrders.receiptStatus,
        invoiceStatus: purchaseOrders.invoiceStatus,
      },
      where: inArray(purchaseOrders.id, ids),
    });
  }

  // Returns the primary-unit counters of every line of the given POs
  async findLineCounters(ids: string[]): Promise<PurchaseOrderLineCounters[]> {
    if (ids.length === 0) return [];
    return this.db
      .select({
        purchaseOrderId: purchaseOrderItems.purchaseOrderId,
        primaryUomQty: purchaseOrderItems.primaryUomQty,
        freePrimaryQty: purchaseOrderItems.freePrimaryQty,
        receivedPrimaryQty: purchaseOrderItems.receivedPrimaryQty,
        invoicedPrimaryQty: purchaseOrderItems.invoicedPrimaryQty,
        returnedPrimaryQty: purchaseOrderItems.returnedPrimaryQty,
        cancelledPrimaryQty: purchaseOrderItems.cancelledPrimaryQty,
      })
      .from(purchaseOrderItems)
      .where(inArray(purchaseOrderItems.purchaseOrderId, ids));
  }

  // Returns the POs of the given lines
  async findIdsByItemIds(purchaseOrderItemIds: string[]): Promise<string[]> {
    if (purchaseOrderItemIds.length === 0) return [];
    const rows = await this.db
      .selectDistinct({ id: purchaseOrderItems.purchaseOrderId })
      .from(purchaseOrderItems)
      .where(inArray(purchaseOrderItems.id, purchaseOrderItemIds));
    return rows.map((row) => row.id);
  }

  // Selects a PO with its supplier name, line count, posted-receipt lock and its latest line delivery date
  private selection() {
    const postedGoodsReceiptItem = this.db
      .select({ id: goodsReceiptItems.id })
      .from(goodsReceiptItems)
      .innerJoin(goodsReceipts, eq(goodsReceipts.id, goodsReceiptItems.goodsReceiptId))
      .innerJoin(purchaseOrderItems, eq(purchaseOrderItems.id, goodsReceiptItems.purchaseOrderItemId))
      .where(
        and(
          eq(purchaseOrderItems.purchaseOrderId, purchaseOrders.id),
          eq(goodsReceipts.status, GoodsReceiptStatusValues.POSTED),
        ),
      );
    const latestExpectedDeliveryDate = this.db
      .select({ date: sql`max(${purchaseOrderItems.expectedDeliveryDate})::text` })
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.purchaseOrderId, purchaseOrders.id));
    return {
      ...getColumns(purchaseOrders),
      supplierName: parties.displayName,
      purchaseNumber: purchases.purchaseNumber,
      itemCount: this.db.$count(purchaseOrderItems, eq(purchaseOrderItems.purchaseOrderId, purchaseOrders.id)),
      hasPostedGoodsReceipt: sql<boolean>`${exists(postedGoodsReceiptItem)}`,
      latestExpectedDeliveryDate: sql<string | null>`(${latestExpectedDeliveryDate})`,
    };
  }

  // Counts the rows each of a PO's tabs lists: its lines, and the inbound deliveries, goods receipts and supplier
  // invoices with a line on one of them
  private counts() {
    const ownLines = eq(purchaseOrderItems.purchaseOrderId, purchaseOrders.id);
    const deliveryLine = this.db
      .select({ id: inboundDeliveryLines.id })
      .from(inboundDeliveryLines)
      .innerJoin(purchaseOrderItems, eq(purchaseOrderItems.id, inboundDeliveryLines.purchaseOrderItemId))
      .where(and(eq(inboundDeliveryLines.inboundDeliveryId, inboundDeliveries.id), ownLines));
    const receiptItem = this.db
      .select({ id: goodsReceiptItems.id })
      .from(goodsReceiptItems)
      .innerJoin(purchaseOrderItems, eq(purchaseOrderItems.id, goodsReceiptItems.purchaseOrderItemId))
      .where(and(eq(goodsReceiptItems.goodsReceiptId, goodsReceipts.id), ownLines));
    const invoiceLine = this.db
      .select({ id: supplierInvoiceLines.id })
      .from(supplierInvoiceLines)
      .innerJoin(purchaseOrderItems, eq(purchaseOrderItems.id, supplierInvoiceLines.purchaseOrderItemId))
      .where(and(eq(supplierInvoiceLines.supplierInvoiceId, supplierInvoices.id), ownLines));
    return {
      itemCount: this.db.$count(purchaseOrderItems, ownLines),
      inboundDeliveryCount: this.db.$count(inboundDeliveries, exists(deliveryLine)),
      goodsReceiptCount: this.db.$count(goodsReceipts, exists(receiptItem)),
      invoiceCount: this.db.$count(supplierInvoices, exists(invoiceLine)),
    };
  }

  // Joins the supplier and its party for the supplier name, and the purchase that created the PO
  private joins() {
    return [
      { table: suppliers, on: eq(suppliers.id, purchaseOrders.supplierId) },
      { table: parties, on: eq(parties.id, suppliers.partyId) },
      { table: purchases, on: eq(purchases.id, purchaseOrders.purchaseId) },
    ];
  }
}
