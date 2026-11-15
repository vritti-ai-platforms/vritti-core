import { Injectable } from '@nestjs/common';
import type { SearchState } from '@vritti/api-sdk/conditions';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, eq, exists, getColumns, ilike, notExists, or, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type GoodsReceipt,
  GoodsReceiptStatusValues,
  goodsReceiptItems,
  goodsReceiptLines,
  goodsReceiptNumberSeq,
  goodsReceipts,
  type InboundDeliverySource,
  InboundDeliverySourceValues,
  inboundDeliveries,
  parties,
  purchaseOrderItems,
  purchaseOrders,
  purchases,
  supplierInvoiceLines,
  suppliers,
} from '@/db/schema';

export type GoodsReceiptRow = GoodsReceipt & {
  supplierName: string | null;
  purchaseNumber: string | null;
  receiveWithInvoiceInvoiceId: string | null;
  deliveryNumber: string;
  deliverySource: InboundDeliverySource;
  carrier: string | null;
  trackingNumber: string | null;
  supplierDeliveryNoteNumber: string | null;
  supplierDeliveryNoteDate: string | null;
  poNumbers: string[];
  expectedDeliveryDate: string | null;
  siteTimezone: string | null;
  itemCount: number;
  isPostable: boolean;
};

@Injectable()
export class GoodsReceiptsDomainRepository extends PrimaryBaseRepository<typeof goodsReceipts> {
  constructor(database: PrimaryDatabaseService) {
    super(database, goodsReceipts, { sequence: goodsReceiptNumberSeq });
  }

  // Generates the next sequential GR number for the current month
  async generateGrNumber(): Promise<string> {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const nextNumber = await this.nextSequenceValue();
    return `GR-${yearMonth}-${String(nextNumber).padStart(4, '0')}`;
  }

  // Loads a receipt with its supplier, inbound delivery, purchase orders and post readiness
  findDetail(id: string): Promise<GoodsReceiptRow | undefined> {
    return this.findById<GoodsReceiptRow>(id, { select: this.selection(), leftJoins: this.joins() });
  }

  // Returns the receipts a purchase created, oldest first
  findForPurchase(purchaseId: string): Promise<GoodsReceiptRow[]> {
    return this.findAllWithSelect<GoodsReceiptRow>({
      select: this.selection(),
      leftJoins: this.joins(),
      where: eq(goodsReceipts.purchaseId, purchaseId),
      orderBy: [asc(goodsReceipts.createdAt)],
    });
  }

  // Returns one page of receipts with their supplier, delivery, purchase orders and post readiness
  async findForTable(options: {
    where?: SQL;
    orderBy: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: GoodsReceiptRow[]; count: number }> {
    return this.findAllAndCount<GoodsReceiptRow>({ select: this.selection(), leftJoins: this.joins(), ...options });
  }

  // Returns up to limit + 1 receipts after a cursor, for the mobile feed
  async findKeysetForFeed(options: {
    where?: SQL;
    orderBy: SQL[];
    limit: number;
  }): Promise<{ rows: GoodsReceiptRow[]; hasMore: boolean }> {
    return this.findKeyset<GoodsReceiptRow>({ select: this.selection(), leftJoins: this.joins(), ...options });
  }

  // Matches receipts counting a line of the given purchase order
  countsPurchaseOrder(purchaseOrderId: string): SQL {
    return exists(this.receiptLinesWhere(eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId)));
  }

  // Matches receipts counting a line of a purchase order whose number contains the search, when it searches PO numbers
  matchesPurchaseOrderNumber(search: SearchState | null | undefined): SQL | undefined {
    if (!search?.value || (search.columnId !== 'all' && search.columnId !== 'poNumbers')) return undefined;
    return exists(this.receiptLinesWhere(ilike(purchaseOrders.poNumber, `%${search.value}%`)));
  }

  // Selects a receipt with its supplier, purchase and inbound delivery (number, source, carrier, tracking, supplier's delivery note), the supplier invoice it is received with, its orders' numbers, latest line delivery date and timezone, item count and post readiness
  private selection() {
    const ownItems = eq(goodsReceiptItems.goodsReceiptId, goodsReceipts.id);
    const itemLines = eq(goodsReceiptLines.goodsReceiptItemId, goodsReceiptItems.id);
    const distributedQuantity = this.db
      .select({ total: sql`coalesce(sum(${goodsReceiptLines.quantity}), 0)` })
      .from(goodsReceiptLines)
      .where(itemLines);
    const unbalancedLine = this.db
      .select({ id: goodsReceiptLines.id })
      .from(goodsReceiptLines)
      .where(and(itemLines, eq(goodsReceiptLines.isBalanced, false)));
    const undistributedItem = this.db
      .select({ id: goodsReceiptItems.id })
      .from(goodsReceiptItems)
      .where(
        and(
          ownItems,
          or(
            sql`(${distributedQuantity}) <> ${goodsReceiptItems.receivedQty} - ${goodsReceiptItems.rejectedQuantity}`,
            exists(unbalancedLine),
          ),
        ),
      );
    const anyItem = this.db.select({ id: goodsReceiptItems.id }).from(goodsReceiptItems).where(ownItems);
    const poNumbers = this.db
      .select({ poNumbers: sql`array_agg(distinct ${purchaseOrders.poNumber} order by ${purchaseOrders.poNumber})` })
      .from(goodsReceiptItems)
      .innerJoin(purchaseOrderItems, eq(purchaseOrderItems.id, goodsReceiptItems.purchaseOrderItemId))
      .innerJoin(purchaseOrders, eq(purchaseOrders.id, purchaseOrderItems.purchaseOrderId))
      .where(ownItems);
    const latestExpectedDeliveryDate = this.db
      .select({ date: sql`max(${purchaseOrderItems.expectedDeliveryDate})` })
      .from(goodsReceiptItems)
      .innerJoin(purchaseOrderItems, eq(purchaseOrderItems.id, goodsReceiptItems.purchaseOrderItemId))
      .where(ownItems);
    const receiveWithInvoiceInvoice = this.db
      .select({ id: supplierInvoiceLines.supplierInvoiceId })
      .from(supplierInvoiceLines)
      .innerJoin(goodsReceiptItems, eq(goodsReceiptItems.id, supplierInvoiceLines.goodsReceiptItemId))
      .where(and(ownItems, eq(inboundDeliveries.source, InboundDeliverySourceValues.SUPPLIER_INVOICE)))
      .limit(1);
    const siteTimezone = this.db
      .select({ timezone: purchaseOrders.timezone })
      .from(goodsReceiptItems)
      .innerJoin(purchaseOrderItems, eq(purchaseOrderItems.id, goodsReceiptItems.purchaseOrderItemId))
      .innerJoin(purchaseOrders, eq(purchaseOrders.id, purchaseOrderItems.purchaseOrderId))
      .where(ownItems)
      .limit(1);

    return {
      ...getColumns(goodsReceipts),
      supplierName: parties.displayName,
      purchaseNumber: purchases.purchaseNumber,
      receiveWithInvoiceInvoiceId: sql<string | null>`(${receiveWithInvoiceInvoice})`,
      deliveryNumber: inboundDeliveries.deliveryNumber,
      deliverySource: inboundDeliveries.source,
      carrier: inboundDeliveries.carrier,
      trackingNumber: inboundDeliveries.trackingNumber,
      supplierDeliveryNoteNumber: inboundDeliveries.supplierDeliveryNoteNumber,
      supplierDeliveryNoteDate: inboundDeliveries.supplierDeliveryNoteDate,
      poNumbers: sql<string[]>`coalesce((${poNumbers}), '{}')`,
      expectedDeliveryDate: sql<string | null>`(${latestExpectedDeliveryDate})`.mapWith(
        purchaseOrderItems.expectedDeliveryDate,
      ),
      siteTimezone: sql<string | null>`(${siteTimezone})`,
      itemCount: this.db.$count(goodsReceiptItems, ownItems),
      isPostable: sql<boolean>`${and(
        eq(goodsReceipts.status, GoodsReceiptStatusValues.DRAFT),
        exists(anyItem),
        notExists(undistributedItem),
      )}`,
    };
  }

  // Selects the receipt's items whose purchase order line and order match the condition
  private receiptLinesWhere(condition: SQL) {
    return this.db
      .select({ id: goodsReceiptItems.id })
      .from(goodsReceiptItems)
      .innerJoin(purchaseOrderItems, eq(purchaseOrderItems.id, goodsReceiptItems.purchaseOrderItemId))
      .innerJoin(purchaseOrders, eq(purchaseOrders.id, purchaseOrderItems.purchaseOrderId))
      .where(and(eq(goodsReceiptItems.goodsReceiptId, goodsReceipts.id), condition));
  }

  // Joins the supplier with its party, the inbound delivery the receipt is posted against and the purchase that created it
  private joins() {
    return [
      { table: suppliers, on: eq(suppliers.id, goodsReceipts.supplierId) },
      { table: parties, on: eq(parties.id, suppliers.partyId) },
      { table: inboundDeliveries, on: eq(inboundDeliveries.id, goodsReceipts.inboundDeliveryId) },
      { table: purchases, on: eq(purchases.id, goodsReceipts.purchaseId) },
    ];
  }
}
