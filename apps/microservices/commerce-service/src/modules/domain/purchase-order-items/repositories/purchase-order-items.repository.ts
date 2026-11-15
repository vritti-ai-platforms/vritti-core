import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import {
  aliasedTable,
  and,
  asc,
  eq,
  exists,
  getColumns,
  inArray,
  ne,
  or,
  type SQL,
  sql,
} from '@vritti/api-sdk/drizzle-orm';
import { type FindForSelectConfig, type SelectQueryResult } from '@vritti/api-sdk/select';
import {
  categories,
  GoodsReceiptStatusValues,
  goodsReceiptItems,
  goodsReceipts,
  InboundDeliveryStatusValues,
  inboundDeliveries,
  inboundDeliveryLines,
  inventoryItems,
  type PurchaseOrderItem,
  purchaseOrderItems,
  SupplierInvoiceStatusValues,
  supplierInvoiceLines,
  supplierInvoices,
  uom,
} from '@/db/schema';

const orderUom = aliasedTable(uom, 'order_uom');

export type PurchaseOrderItemRow = PurchaseOrderItem & {
  inventoryItemName: string | null;
  orderUomSymbol: string | null;
  primaryUomSymbol: string | null;
  inboundDeliveryNumbers: string[];
  inboundDeliveryIds: string[];
  inboundDeliveryDates: string[];
  isTaxDateLocked: boolean;
};

export type PurchaseOrderItemCounters = Pick<
  PurchaseOrderItem,
  'receivedPrimaryQty' | 'rejectedPrimaryQty' | 'invoicedPrimaryQty' | 'returnedPrimaryQty' | 'cancelledPrimaryQty'
>;

@Injectable()
export class PurchaseOrderItemsDomainRepository extends PrimaryBaseRepository<typeof purchaseOrderItems> {
  constructor(database: PrimaryDatabaseService) {
    super(database, purchaseOrderItems);
  }

  // Returns the lines of one PO as select options
  findForSelectByPurchaseOrder(purchaseOrderId: string, config: FindForSelectConfig): Promise<SelectQueryResult> {
    return super.findForSelect({
      ...config,
      joins: [
        { table: inventoryItems, on: eq(inventoryItems.id, purchaseOrderItems.inventoryItemId), type: 'inner' },
        { table: categories, on: eq(categories.id, inventoryItems.categoryId), type: 'left' },
        { table: orderUom, on: eq(orderUom.id, purchaseOrderItems.uomId), type: 'left' },
      ],
      groupTable: config.groupIdKey === 'categoryId' ? categories : undefined,
      conditions: [eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId)],
      additionalExpressions: {
        orderedQty: sql`${purchaseOrderItems.uomQty}`,
        primaryUomQty: sql`${purchaseOrderItems.primaryUomQty}`,
        freePrimaryQty: sql`${purchaseOrderItems.freePrimaryQty}`,
        receivedPrimaryQty: sql`${purchaseOrderItems.receivedPrimaryQty}`,
        invoicedPrimaryQty: sql`${purchaseOrderItems.invoicedPrimaryQty}`,
        cancelledPrimaryQty: sql`${purchaseOrderItems.cancelledPrimaryQty}`,
        uomSymbol: sql`${orderUom.symbol}`,
        allowDecimal: sql`${orderUom.allowDecimal}`,
      },
    });
  }

  // Returns every line of a PO
  async findByPurchaseOrderId(purchaseOrderId: string): Promise<PurchaseOrderItemRow[]> {
    return this.findAllWithSelect<PurchaseOrderItemRow>({
      select: this.selection(),
      leftJoins: this.joins(),
      where: eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId),
      orderBy: [asc(inventoryItems.name)],
    });
  }

  // Returns every line of the given POs
  async findByPurchaseOrderIds(purchaseOrderIds: string[]): Promise<PurchaseOrderItemRow[]> {
    if (purchaseOrderIds.length === 0) return [];
    return this.findAllWithSelect<PurchaseOrderItemRow>({
      select: this.selection(),
      leftJoins: this.joins(),
      where: inArray(purchaseOrderItems.purchaseOrderId, purchaseOrderIds),
      orderBy: [asc(inventoryItems.name)],
    });
  }

  // Returns one page of a PO's lines
  async findForTable(
    purchaseOrderId: string,
    options: { where?: SQL; orderBy: SQL[]; limit: number; offset: number },
  ): Promise<{ result: PurchaseOrderItemRow[]; count: number }> {
    return this.findAllAndCount<PurchaseOrderItemRow>({
      select: this.selection(),
      leftJoins: this.joins(),
      ...options,
      where: and(eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId), options.where),
    });
  }

  // Returns the inventory items ordered on a PO
  async findInventoryItemIds(purchaseOrderId: string): Promise<string[]> {
    const rows = await this.findMany({ where: { purchaseOrderId } });
    return rows.map((row) => row.inventoryItemId);
  }

  // Loads a line of the given PO
  findOnPurchaseOrder(purchaseOrderId: string, itemId: string): Promise<PurchaseOrderItem | undefined> {
    return this.findOne({ id: itemId, purchaseOrderId });
  }

  // Loads a line of the given PO with its delivery numbers and tax date lock
  findDetailOnPurchaseOrder(purchaseOrderId: string, itemId: string): Promise<PurchaseOrderItemRow | undefined> {
    return this.findById<PurchaseOrderItemRow>(itemId, {
      select: this.selection(),
      leftJoins: this.joins(),
      where: eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId),
    });
  }

  // Moves every line of a PO that follows its tax date to the new one
  async setFollowersTaxDate(purchaseOrderId: string, taxDate: string): Promise<number> {
    const { count } = await this.updateMany(
      and(
        eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId),
        eq(purchaseOrderItems.isTaxDateOverridden, false),
      ) as SQL,
      { taxDate },
    );
    return count;
  }

  // Moves a line's counters by the given primary quantities in one statement; negative amounts move them back
  async addToCounters(id: string, deltas: Partial<PurchaseOrderItemCounters>): Promise<void> {
    const moved = Object.fromEntries(
      Object.entries(deltas).map(([key, delta]) => {
        const column = purchaseOrderItems[key as keyof PurchaseOrderItemCounters];
        return [key, sql`${column} + ${delta}`];
      }),
    );
    await this.db.update(purchaseOrderItems).set(moved).where(eq(purchaseOrderItems.id, id));
  }

  // Whether a line that follows the PO's tax date is counted by a posted goods receipt or a posted supplier invoice
  hasLockedFollower(purchaseOrderId: string): Promise<boolean> {
    return this.exists(
      and(
        eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId),
        eq(purchaseOrderItems.isTaxDateOverridden, false),
        this.taxDateLocked(),
      ) as SQL,
    );
  }

  // Whether another line of the PO already orders the item in the same unit
  isOrderedInUnit(
    purchaseOrderId: string,
    line: { inventoryItemId: string; uomId: string },
    excludeItemId?: string,
  ): Promise<boolean> {
    return this.exists(
      and(
        eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId),
        eq(purchaseOrderItems.inventoryItemId, line.inventoryItemId),
        eq(purchaseOrderItems.uomId, line.uomId),
        excludeItemId ? ne(purchaseOrderItems.id, excludeItemId) : undefined,
      ) as SQL,
    );
  }

  // Whether a goods receipt (draft or posted) counts goods against the line
  async isOnGoodsReceipt(itemId: string): Promise<boolean> {
    const [receiptItem] = await this.db
      .select({ id: goodsReceiptItems.id })
      .from(goodsReceiptItems)
      .where(eq(goodsReceiptItems.purchaseOrderItemId, itemId))
      .limit(1);
    return receiptItem !== undefined;
  }

  // Selects a PO line with its item and unit names, its live inbound deliveries' numbers, ids and dates and its tax date lock
  private selection() {
    const liveDeliveries = (column: SQL) =>
      this.db
        .select({ values: sql`array_agg(${column} order by ${inboundDeliveries.deliveryNumber})` })
        .from(inboundDeliveryLines)
        .innerJoin(inboundDeliveries, eq(inboundDeliveries.id, inboundDeliveryLines.inboundDeliveryId))
        .where(
          and(
            eq(inboundDeliveryLines.purchaseOrderItemId, purchaseOrderItems.id),
            ne(inboundDeliveries.status, InboundDeliveryStatusValues.CANCELLED),
          ),
        );
    return {
      ...getColumns(purchaseOrderItems),
      inventoryItemName: inventoryItems.name,
      orderUomSymbol: orderUom.symbol,
      primaryUomSymbol: uom.symbol,
      inboundDeliveryNumbers: sql<
        string[]
      >`coalesce((${liveDeliveries(sql`${inboundDeliveries.deliveryNumber}`)}), '{}')`,
      inboundDeliveryIds: sql<string[]>`coalesce((${liveDeliveries(sql`${inboundDeliveries.id}::text`)}), '{}')`,
      inboundDeliveryDates: sql<
        string[]
      >`coalesce((${liveDeliveries(sql`${inboundDeliveries.expectedDeliveryDate}::text`)}), '{}')`,
      isTaxDateLocked: sql<boolean>`${this.taxDateLocked()}`,
    };
  }

  // Whether a posted goods receipt or a posted supplier invoice counts the line
  private taxDateLocked(): SQL {
    const postedReceiptItem = this.db
      .select({ id: goodsReceiptItems.id })
      .from(goodsReceiptItems)
      .innerJoin(goodsReceipts, eq(goodsReceipts.id, goodsReceiptItems.goodsReceiptId))
      .where(
        and(
          eq(goodsReceiptItems.purchaseOrderItemId, purchaseOrderItems.id),
          eq(goodsReceipts.status, GoodsReceiptStatusValues.POSTED),
        ),
      );
    const postedInvoiceLine = this.db
      .select({ id: supplierInvoiceLines.id })
      .from(supplierInvoiceLines)
      .innerJoin(supplierInvoices, eq(supplierInvoices.id, supplierInvoiceLines.supplierInvoiceId))
      .where(
        and(
          eq(supplierInvoiceLines.purchaseOrderItemId, purchaseOrderItems.id),
          eq(supplierInvoices.status, SupplierInvoiceStatusValues.POSTED),
        ),
      );
    return or(exists(postedReceiptItem), exists(postedInvoiceLine)) as SQL;
  }

  // Joins the inventory item, the ordered unit and the item's primary unit
  private joins() {
    return [
      { table: inventoryItems, on: eq(inventoryItems.id, purchaseOrderItems.inventoryItemId) },
      { table: orderUom, on: eq(orderUom.id, purchaseOrderItems.uomId) },
      { table: uom, on: eq(uom.id, inventoryItems.uomId) },
    ];
  }
}
