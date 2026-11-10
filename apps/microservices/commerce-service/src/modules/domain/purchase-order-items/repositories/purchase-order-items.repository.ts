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
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ValidationException,
} from '@vritti/api-sdk/exceptions';
import { type FindForSelectConfig, type SelectQueryResult } from '@vritti/api-sdk/select';
import { isBefore, parseISO } from 'date-fns';
import {
  categories,
  GoodsReceiptStatusValues,
  goodsReceiptItems,
  goodsReceipts,
  InboundDeliveryStatusValues,
  inboundDeliveries,
  inboundDeliveryLines,
  inventoryItems,
  type PurchaseOrder,
  type PurchaseOrderItem,
  type PurchaseOrderStatus,
  PurchaseOrderStatusValues,
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
  isTaxDateLocked: boolean;
};

export type LinedPurchaseOrder = Pick<PurchaseOrder, 'poNumber' | 'status'> & { hasPublishedGoodsReceipt: boolean };

export type PricedPurchaseOrder = Pick<PurchaseOrder, 'currencyCode' | 'conversionRates'>;

export type LineTaxDateChange = { taxDate?: string; followPoTaxDate?: boolean };

@Injectable()
export class PurchaseOrderItemsDomainRepository extends PrimaryBaseRepository<typeof purchaseOrderItems> {
  private static readonly EDITABLE_STATUSES: PurchaseOrderStatus[] = [
    PurchaseOrderStatusValues.DRAFT,
    PurchaseOrderStatusValues.SENT,
    PurchaseOrderStatusValues.CONFIRMED,
  ];

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
        expectedFreeQty: sql`${purchaseOrderItems.freeQty}`,
        receivedQty: sql`${purchaseOrderItems.receivedQuantity}`,
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

  // Loads a line of the given PO, throwing when it is not on it
  async findOnPurchaseOrderOrThrow(purchaseOrderId: string, itemId: string): Promise<PurchaseOrderItem> {
    const item = await this.findOne({ id: itemId, purchaseOrderId });
    if (!item) throw new NotFoundException('Purchase order line item not found.');
    return item;
  }

  // Loads a line of the given PO with its delivery numbers and tax date lock, throwing when it is not on it
  async findDetailOnPurchaseOrderOrThrow(purchaseOrderId: string, itemId: string): Promise<PurchaseOrderItemRow> {
    const item = await this.findById<PurchaseOrderItemRow>(itemId, {
      select: this.selection(),
      leftJoins: this.joins(),
      where: eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId),
    });
    if (!item) throw new NotFoundException('Purchase order line item not found.');
    return item;
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

  // Sets the received quantity of every PO line a receipt counts to what all its published receipts accepted (received less rejected)
  async syncReceivedQuantitiesForReceipt(goodsReceiptId: string): Promise<void> {
    const acceptedOnPublishedReceipts = this.db
      .select({
        accepted: sql`coalesce(sum(${goodsReceiptItems.receivedQty} - ${goodsReceiptItems.rejectedQuantity}), 0)`,
      })
      .from(goodsReceiptItems)
      .innerJoin(goodsReceipts, eq(goodsReceipts.id, goodsReceiptItems.goodsReceiptId))
      .where(
        and(
          eq(goodsReceiptItems.purchaseOrderItemId, purchaseOrderItems.id),
          eq(goodsReceipts.status, GoodsReceiptStatusValues.PUBLISHED),
        ),
      );
    await this.db
      .update(purchaseOrderItems)
      .set({ receivedQuantity: sql`(${acceptedOnPublishedReceipts})` })
      .where(
        inArray(
          purchaseOrderItems.id,
          this.db
            .select({ id: goodsReceiptItems.purchaseOrderItemId })
            .from(goodsReceiptItems)
            .where(eq(goodsReceiptItems.goodsReceiptId, goodsReceiptId)),
        ),
      );
  }

  // Sets each given line's expected delivery to the latest date of the live inbound deliveries holding it; a line on none keeps its date
  async syncExpectedDeliveryDates(purchaseOrderItemIds: string[]): Promise<void> {
    if (purchaseOrderItemIds.length === 0) return;
    const latest = this.db
      .select({
        purchaseOrderItemId: inboundDeliveryLines.purchaseOrderItemId,
        expectedDeliveryDate: sql<string>`max(${inboundDeliveries.expectedDeliveryDate})`.as(
          'latest_expected_delivery_date',
        ),
      })
      .from(inboundDeliveryLines)
      .innerJoin(inboundDeliveries, eq(inboundDeliveries.id, inboundDeliveryLines.inboundDeliveryId))
      .where(
        and(
          inArray(inboundDeliveryLines.purchaseOrderItemId, purchaseOrderItemIds),
          ne(inboundDeliveries.status, InboundDeliveryStatusValues.CANCELLED),
        ),
      )
      .groupBy(inboundDeliveryLines.purchaseOrderItemId)
      .as('latest_delivery');
    await this.db
      .update(purchaseOrderItems)
      .set({ expectedDeliveryDate: sql`${latest.expectedDeliveryDate}` })
      .from(latest)
      .where(
        and(
          eq(purchaseOrderItems.id, latest.purchaseOrderItemId),
          sql`${purchaseOrderItems.expectedDeliveryDate} is distinct from ${latest.expectedDeliveryDate}`,
        ),
      );
  }

  // Rejects a line change once the PO is past confirmation or one of its receipts is published
  assertLinesEditable(po: LinedPurchaseOrder): void {
    const isEditableStatus = PurchaseOrderItemsDomainRepository.EDITABLE_STATUSES.includes(po.status);
    if (isEditableStatus && !po.hasPublishedGoodsReceipt) return;
    throw new BadRequestException({
      label: 'Cannot Edit Line Items',
      detail: `"${po.poNumber}" is ${po.status} or has a published goods receipt, so its line items are locked.`,
    });
  }

  // Rejects a line expected before the PO's order date
  assertDeliveryNotBeforeOrder(po: Pick<PurchaseOrder, 'orderDate'>, expectedDeliveryDate: string): void {
    if (!isBefore(parseISO(expectedDeliveryDate), parseISO(po.orderDate))) return;
    throw new BadRequestException({
      label: 'Delivery Before Order Date',
      detail: `The order is dated ${po.orderDate}, so this line cannot be expected on ${expectedDeliveryDate}.`,
      errors: [{ field: 'expectedDeliveryDate', message: 'Before the order date' }],
    });
  }

  // Rejects a new expected delivery for a line on an inbound delivery, whose date the deliveries set
  assertDeliveryDateEditable(item: Pick<PurchaseOrderItemRow, 'inboundDeliveryNumbers'>): void {
    if (item.inboundDeliveryNumbers.length === 0) return;
    throw new BadRequestException({
      label: 'Delivery Date Set By Deliveries',
      detail: `This line is on inbound delivery ${item.inboundDeliveryNumbers.join(', ')}, so its expected delivery follows the delivery. Change the date on the delivery instead.`,
      errors: [{ field: 'expectedDeliveryDate', message: 'Set by inbound delivery' }],
    });
  }

  // Rejects a tax date change that both sets a date and asks the line to follow the PO
  assertSingleTaxDateChange(change: LineTaxDateChange): void {
    if (change.taxDate === undefined || !change.followPoTaxDate) return;
    throw new BadRequestException({
      label: 'Conflicting Tax Date',
      detail: 'Either set a tax date for this line or let it follow the purchase order, not both.',
      errors: [{ field: 'taxDate', message: 'Conflicts with following the PO' }],
    });
  }

  // Rejects a tax date change on a line a published goods receipt or a posted supplier invoice counts
  assertTaxDateUnlocked(item: Pick<PurchaseOrderItemRow, 'isTaxDateLocked'>): void {
    if (!item.isTaxDateLocked) return;
    throw new BadRequestException({
      label: 'Tax Date Locked',
      detail: 'A published goods receipt or a posted supplier invoice counts this line, so its tax date is locked.',
      errors: [{ field: 'taxDate', message: 'Locked' }],
    });
  }

  // Rejects moving a PO's tax date while a line that follows it is locked by a receipt or an invoice
  async assertFollowersUnlocked(purchaseOrderId: string): Promise<void> {
    const hasLockedFollower = await this.exists(
      and(
        eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId),
        eq(purchaseOrderItems.isTaxDateOverridden, false),
        this.taxDateLocked(),
      ) as SQL,
    );
    if (!hasLockedFollower) return;
    throw new BadRequestException({
      label: 'Cannot Change Tax Date',
      detail:
        'A line that follows the tax date is counted by a published goods receipt or a posted supplier invoice, so the tax date is locked.',
      errors: [{ field: 'taxDate', message: 'Locked' }],
    });
  }

  // Rejects ordering an item in a unit another line of the PO already orders it in
  async assertNotOnPurchaseOrder(
    purchaseOrderId: string,
    line: { inventoryItemId: string; uomId: string },
    field: 'supplierItemId' | 'inventoryItemId',
    excludeItemId?: string,
  ): Promise<void> {
    const isOrdered = await this.exists(
      and(
        eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId),
        eq(purchaseOrderItems.inventoryItemId, line.inventoryItemId),
        eq(purchaseOrderItems.uomId, line.uomId),
        excludeItemId ? ne(purchaseOrderItems.id, excludeItemId) : undefined,
      ) as SQL,
    );
    if (!isOrdered) return;
    throw new ConflictException({
      label: 'Already Ordered',
      detail: 'This item is already on the purchase order in the same unit. Edit that line instead.',
      errors: [{ field, message: 'Already on this order' }],
    });
  }

  // Rejects removing a line, or changing its item, once a goods receipt (draft or published) counts goods against it
  async assertNotOnGoodsReceipt(itemId: string, label: string): Promise<void> {
    const [receiptItem] = await this.db
      .select({ id: goodsReceiptItems.id })
      .from(goodsReceiptItems)
      .where(eq(goodsReceiptItems.purchaseOrderItemId, itemId))
      .limit(1);
    if (!receiptItem) return;
    throw new BadRequestException({
      label,
      detail: 'A goods receipt counts goods against this line. Remove it from the receipt first.',
    });
  }

  // Returns the PO's stored rate into its currency for a price quoted in another of the supplier's currencies
  conversionRateOrThrow(po: PricedPurchaseOrder, currencyCode: string, supplierCurrencies: string[]): string {
    if (!supplierCurrencies.includes(currencyCode)) {
      throw new ValidationException({
        label: 'Currency Not Accepted',
        detail: `The unit price must be in one of the supplier's currencies (${supplierCurrencies.join(', ')}).`,
        errors: [{ field: 'unitPrice', message: "Not one of the supplier's currencies" }],
      });
    }
    const rate = po.conversionRates[currencyCode];
    if (rate) return rate;
    throw new ValidationException({
      label: 'Conversion Rate Required',
      detail: `Enter how much 1 ${currencyCode} is in ${po.currencyCode} to price this line.`,
      errors: [{ field: 'conversionRate', message: `1 ${currencyCode} in ${po.currencyCode}` }],
    });
  }

  // Selects a PO line with its item and unit names, its live inbound deliveries' numbers and ids and its tax date lock
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
      isTaxDateLocked: sql<boolean>`${this.taxDateLocked()}`,
    };
  }

  // Whether a published goods receipt or a posted supplier invoice counts the line
  private taxDateLocked(): SQL {
    const publishedReceiptItem = this.db
      .select({ id: goodsReceiptItems.id })
      .from(goodsReceiptItems)
      .innerJoin(goodsReceipts, eq(goodsReceipts.id, goodsReceiptItems.goodsReceiptId))
      .where(
        and(
          eq(goodsReceiptItems.purchaseOrderItemId, purchaseOrderItems.id),
          eq(goodsReceipts.status, GoodsReceiptStatusValues.PUBLISHED),
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
    return or(exists(publishedReceiptItem), exists(postedInvoiceLine)) as SQL;
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
