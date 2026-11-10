import { Injectable } from '@nestjs/common';
import type { SearchState } from '@vritti/api-sdk/conditions';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, eq, exists, getColumns, ilike, notExists, or, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';
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
  suppliers,
} from '@/db/schema';

export type GoodsReceiptRow = GoodsReceipt & {
  supplierName: string | null;
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
  isPublishable: boolean;
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

  // Loads a receipt with its supplier, inbound delivery, purchase orders and publish readiness, throwing when it is out of reach
  async findDetailOrThrow(id: string): Promise<GoodsReceiptRow> {
    const row = await this.findById<GoodsReceiptRow>(id, { select: this.selection(), leftJoins: this.joins() });
    if (!row) throw new NotFoundException('Goods receipt not found.');
    return row;
  }

  // Loads a receipt that is still a draft — the only state whose items, lots and lines may change
  async findDraftOrThrow(id: string, label: string): Promise<GoodsReceiptRow> {
    const receipt = await this.findDetailOrThrow(id);
    if (receipt.status === GoodsReceiptStatusValues.DRAFT) return receipt;
    throw new BadRequestException({
      label,
      detail: `"${receipt.grNumber}" is published, so it can no longer change.`,
    });
  }

  // Returns one page of receipts with their supplier, delivery, purchase orders and publish readiness
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

  // Rejects adding a purchase order to a receipt of an announced delivery, which carries only that delivery's lines
  assertTakesPurchaseOrders(receipt: Pick<GoodsReceiptRow, 'deliverySource' | 'deliveryNumber'>): void {
    if (receipt.deliverySource === InboundDeliverySourceValues.RECEIPT) return;
    throw new BadRequestException({
      label: 'Cannot Add Purchase Order',
      detail: `This receipt receives inbound delivery "${receipt.deliveryNumber}", so it carries only that delivery's lines.`,
      errors: [{ field: 'purchaseOrderId', message: 'Receipt of an announced delivery' }],
    });
  }

  // Rejects changing the supplier's delivery note on a receipt of an announced delivery, whose note is edited on that delivery
  assertOwnsDeliveryNote(receipt: Pick<GoodsReceiptRow, 'deliverySource' | 'deliveryNumber'>): void {
    if (receipt.deliverySource === InboundDeliverySourceValues.RECEIPT) return;
    throw new BadRequestException({
      label: 'Cannot Edit Delivery Note',
      detail: `This receipt receives inbound delivery "${receipt.deliveryNumber}". Change the supplier's delivery note on that delivery.`,
      errors: [{ field: 'supplierDeliveryNoteNumber', message: 'Edit it on the delivery' }],
    });
  }

  // Rejects publishing a receipt until every item's accepted quantity is fully distributed to balanced lines
  assertPublishable(receipt: GoodsReceiptRow): void {
    if (receipt.isPublishable) return;
    throw new BadRequestException({
      label: 'Not Ready to Publish',
      detail:
        receipt.itemCount === 0
          ? `Add at least one item to "${receipt.grNumber}" before publishing it.`
          : 'Distribute the accepted quantity of every item to lines, and finish their serials, before publishing.',
    });
  }

  // Selects a receipt with its supplier and inbound delivery (number, source, carrier, tracking, supplier's delivery note), its orders' numbers, latest line delivery date and timezone, item count and publish readiness
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
      isPublishable: sql<boolean>`${and(
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

  // Joins the supplier with its party, and the inbound delivery the receipt is posted against
  private joins() {
    return [
      { table: suppliers, on: eq(suppliers.id, goodsReceipts.supplierId) },
      { table: parties, on: eq(parties.id, suppliers.partyId) },
      { table: inboundDeliveries, on: eq(inboundDeliveries.id, goodsReceipts.inboundDeliveryId) },
    ];
  }
}
