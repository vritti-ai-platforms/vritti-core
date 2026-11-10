import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, eq, exists, getColumns, inArray, notExists, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, NotFoundException, ValidationException } from '@vritti/api-sdk/exceptions';
import {
  GoodsReceiptStatusValues,
  goodsReceiptItems,
  goodsReceipts,
  type PurchaseOrder,
  type PurchaseOrderStatus,
  PurchaseOrderStatusValues,
  parties,
  purchaseOrderItems,
  purchaseOrderNumberSeq,
  purchaseOrders,
  suppliers,
} from '@/db/schema';

export type PurchaseOrderRow = PurchaseOrder & {
  supplierName: string | null;
  itemCount: number;
  hasPublishedGoodsReceipt: boolean;
  latestExpectedDeliveryDate: string | null;
};

@Injectable()
export class PurchaseOrdersDomainRepository extends PrimaryBaseRepository<typeof purchaseOrders> {
  private static readonly RECEIVABLE_STATUSES: PurchaseOrderStatus[] = [
    PurchaseOrderStatusValues.CONFIRMED,
    PurchaseOrderStatusValues.PARTIALLY_RECEIVED,
  ];
  private static readonly TAX_DATE_EDITABLE_STATUSES: PurchaseOrderStatus[] = [
    PurchaseOrderStatusValues.DRAFT,
    PurchaseOrderStatusValues.SENT,
    PurchaseOrderStatusValues.CONFIRMED,
  ];

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

  // Loads a PO with its supplier name, line count and receipt state, throwing when it is out of reach
  async findDetailOrThrow(id: string): Promise<PurchaseOrderRow> {
    const row = await this.findById<PurchaseOrderRow>(id, {
      select: this.selection(),
      leftJoins: this.supplierJoins(),
    });
    if (!row) throw new NotFoundException('Purchase order not found.');
    return row;
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
      leftJoins: this.supplierJoins(),
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

  // Moves each receivable PO a receipt counts to received once every line covers ordered plus free, else to partially received once any line has goods
  async syncReceiptStatusesForReceipt(goodsReceiptId: string): Promise<Pick<PurchaseOrder, 'poNumber' | 'status'>[]> {
    const ownLines = eq(purchaseOrderItems.purchaseOrderId, purchaseOrders.id);
    const linesWhere = (condition?: SQL) =>
      this.db.select({ id: purchaseOrderItems.id }).from(purchaseOrderItems).where(and(ownLines, condition));
    const nextStatus = sql`case
      when ${exists(linesWhere())} and ${notExists(
        linesWhere(
          sql`${purchaseOrderItems.receivedQuantity} < ${purchaseOrderItems.uomQty} + ${purchaseOrderItems.freeQty}`,
        ),
      )} then ${PurchaseOrderStatusValues.RECEIVED}
      when ${exists(linesWhere(sql`${purchaseOrderItems.receivedQuantity} > 0`))} then ${PurchaseOrderStatusValues.PARTIALLY_RECEIVED}
      else ${purchaseOrders.status}
    end`;
    const countedOrders = this.db
      .select({ id: purchaseOrderItems.purchaseOrderId })
      .from(goodsReceiptItems)
      .innerJoin(purchaseOrderItems, eq(purchaseOrderItems.id, goodsReceiptItems.purchaseOrderItemId))
      .where(eq(goodsReceiptItems.goodsReceiptId, goodsReceiptId));

    return this.db
      .update(purchaseOrders)
      .set({ status: nextStatus })
      .where(
        and(
          inArray(purchaseOrders.id, countedOrders),
          inArray(purchaseOrders.status, PurchaseOrdersDomainRepository.RECEIVABLE_STATUSES),
          sql`${purchaseOrders.status} <> ${nextStatus}`,
        ),
      )
      .returning({ poNumber: purchaseOrders.poNumber, status: purchaseOrders.status });
  }

  // Confirms the sent orders of the given lines — a supplier announcing their delivery confirms the order
  async confirmSentForItems(purchaseOrderItemIds: string[]): Promise<Pick<PurchaseOrder, 'poNumber'>[]> {
    if (purchaseOrderItemIds.length === 0) return [];
    return this.db
      .update(purchaseOrders)
      .set({ status: PurchaseOrderStatusValues.CONFIRMED })
      .where(
        and(
          eq(purchaseOrders.status, PurchaseOrderStatusValues.SENT),
          inArray(
            purchaseOrders.id,
            this.db
              .select({ id: purchaseOrderItems.purchaseOrderId })
              .from(purchaseOrderItems)
              .where(inArray(purchaseOrderItems.id, purchaseOrderItemIds)),
          ),
        ),
      )
      .returning({ poNumber: purchaseOrders.poNumber });
  }

  // Whether goods can be received against the PO: it is confirmed or partially received
  isReceivable(po: Pick<PurchaseOrder, 'status'>): boolean {
    return PurchaseOrdersDomainRepository.RECEIVABLE_STATUSES.includes(po.status);
  }

  // Rejects a change to what the PO's receipts are costed at once one of them is published
  assertPricingUnlocked(po: Pick<PurchaseOrderRow, 'poNumber' | 'hasPublishedGoodsReceipt'>, label: string): void {
    if (!po.hasPublishedGoodsReceipt) return;
    throw new BadRequestException({
      label,
      detail: `A goods receipt of "${po.poNumber}" is published, so its supplier, prices and rates are locked.`,
    });
  }

  // Rejects a supplier change unless the PO is a draft without lines and none of its receipts is published
  assertSupplierChangeable(po: PurchaseOrderRow): void {
    if (po.status !== PurchaseOrderStatusValues.DRAFT) {
      throw new BadRequestException({
        label: 'Cannot Change Supplier',
        detail: 'The supplier can only be changed while the purchase order is a draft.',
      });
    }
    if (po.itemCount > 0) {
      throw new BadRequestException({
        label: 'Cannot Change Supplier',
        detail: 'Remove all line items before changing the supplier.',
      });
    }
    this.assertPricingUnlocked(po, 'Cannot Change Supplier');
  }

  // Rejects a tax date change once the PO is past confirmation or one of its receipts is published
  assertTaxDateEditable(po: Pick<PurchaseOrderRow, 'poNumber' | 'status' | 'hasPublishedGoodsReceipt'>): void {
    const isEditableStatus = PurchaseOrdersDomainRepository.TAX_DATE_EDITABLE_STATUSES.includes(po.status);
    if (isEditableStatus && !po.hasPublishedGoodsReceipt) return;
    throw new BadRequestException({
      label: 'Cannot Change Tax Date',
      detail: `"${po.poNumber}" is ${po.status} or has a published goods receipt, so its tax date is locked.`,
      errors: [{ field: 'taxDate', message: 'Locked' }],
    });
  }

  // Returns the rate a PO stores: 1 in the legal entity's own currency, the given one in any other
  resolveExchangeRateOrThrow(currencyCode: string, leCurrencyCode: string, exchangeRate: number | undefined): number {
    if (currencyCode === leCurrencyCode) return 1;
    if (exchangeRate !== undefined) return exchangeRate;
    throw new ValidationException({
      label: 'Exchange Rate Required',
      detail: `The order is in ${currencyCode}; enter how much 1 ${currencyCode} is in ${leCurrencyCode}.`,
      errors: [{ field: 'exchangeRate', message: `1 ${currencyCode} in ${leCurrencyCode}` }],
    });
  }

  // Selects a PO with its supplier name, line count, published-receipt lock and its latest line delivery date
  private selection() {
    const publishedGoodsReceiptItem = this.db
      .select({ id: goodsReceiptItems.id })
      .from(goodsReceiptItems)
      .innerJoin(goodsReceipts, eq(goodsReceipts.id, goodsReceiptItems.goodsReceiptId))
      .innerJoin(purchaseOrderItems, eq(purchaseOrderItems.id, goodsReceiptItems.purchaseOrderItemId))
      .where(
        and(
          eq(purchaseOrderItems.purchaseOrderId, purchaseOrders.id),
          eq(goodsReceipts.status, GoodsReceiptStatusValues.PUBLISHED),
        ),
      );
    const latestExpectedDeliveryDate = this.db
      .select({ date: sql`max(${purchaseOrderItems.expectedDeliveryDate})::text` })
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.purchaseOrderId, purchaseOrders.id));
    return {
      ...getColumns(purchaseOrders),
      supplierName: parties.displayName,
      itemCount: this.db.$count(purchaseOrderItems, eq(purchaseOrderItems.purchaseOrderId, purchaseOrders.id)),
      hasPublishedGoodsReceipt: sql<boolean>`${exists(publishedGoodsReceiptItem)}`,
      latestExpectedDeliveryDate: sql<string | null>`(${latestExpectedDeliveryDate})`,
    };
  }

  // Joins the supplier and its party for the supplier name
  private supplierJoins() {
    return [
      { table: suppliers, on: eq(suppliers.id, purchaseOrders.supplierId) },
      { table: parties, on: eq(parties.id, suppliers.partyId) },
    ];
  }
}
