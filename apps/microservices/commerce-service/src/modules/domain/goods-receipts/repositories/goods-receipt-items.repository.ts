import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { aliasedTable, and, asc, desc, eq, getColumns, ne, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';
import {
  type GoodsReceiptItem,
  type GoodsReceiptStatus,
  GoodsReceiptStatusValues,
  goodsReceiptItems,
  goodsReceiptLineItems,
  goodsReceiptLines,
  goodsReceiptLots,
  goodsReceipts,
  type InventoryTracking,
  InventoryTrackingValues,
  inventoryItems,
  locations,
  type NewGoodsReceiptItem,
  purchaseOrderItems,
  purchaseOrders,
  uom,
} from '@/db/schema';
import type { GoodsReceiptTreeNode } from '../dto/entity/goods-receipt-tree.dto';

const itemUom = aliasedTable(uom, 'item_uom');
const otherReceiptItems = aliasedTable(goodsReceiptItems, 'other_receipt_items');
const otherReceipts = aliasedTable(goodsReceipts, 'other_receipts');

export type GoodsReceiptItemRow = GoodsReceiptItem & {
  inventoryItemName: string | null;
  inventoryItemTracking: InventoryTracking;
  uomSymbol: string | null;
  uomAllowDecimal: boolean;
  primaryUomSymbol: string | null;
  receivedDate: string;
  orderedQty: number;
  expectedFreeQty: number;
  poPrimaryUomQty: number;
  poUnitPrice: bigint;
  poTotalPrice: bigint;
  poCurrencyCode: string;
  poExchangeRate: number;
  alreadyReceivedQty: number;
  distributedQty: number;
  lotsCount: number;
  linesCount: number;
  unbalancedLinesCount: number;
  earliestExpiryDate: string | null;
  earliestExpiryLotNumber: string | null;
};

export type PurchaseOrderReceiptItemRow = GoodsReceiptItemRow & {
  grNumber: string;
  receiptStatus: GoodsReceiptStatus;
};

export type GoodsReceiptDraftLine = Pick<
  GoodsReceiptItem,
  'purchaseOrderItemId' | 'inventoryItemId' | 'uomId' | 'receivedQty'
>;

export type GoodsReceiptItemContext = Pick<
  GoodsReceiptItem,
  'id' | 'goodsReceiptId' | 'siteId' | 'inventoryItemId' | 'uomId' | 'receivedQty' | 'rejectedQuantity'
> & {
  receiptStatus: GoodsReceiptStatus;
  tracking: InventoryTracking;
};

@Injectable()
export class GoodsReceiptItemsDomainRepository extends PrimaryBaseRepository<typeof goodsReceiptItems> {
  constructor(database: PrimaryDatabaseService) {
    super(database, goodsReceiptItems);
  }

  // Returns one page of a receipt's items with their purchase order line and distribution progress
  async findForTable(
    goodsReceiptId: string,
    options: { where?: SQL; orderBy: SQL[]; limit: number; offset: number },
  ): Promise<{ result: GoodsReceiptItemRow[]; count: number }> {
    return this.findAllAndCount<GoodsReceiptItemRow>({
      select: this.selection(),
      leftJoins: this.joins(),
      ...options,
      where: and(eq(goodsReceiptItems.goodsReceiptId, goodsReceiptId), options.where),
    });
  }

  // Returns every item of a receipt with its purchase order line and distribution progress
  async findByReceiptId(goodsReceiptId: string): Promise<GoodsReceiptItemRow[]> {
    return this.findAllWithSelect<GoodsReceiptItemRow>({
      select: this.selection(),
      leftJoins: this.joins(),
      where: eq(goodsReceiptItems.goodsReceiptId, goodsReceiptId),
      orderBy: [asc(goodsReceiptItems.createdAt)],
    });
  }

  // Returns every receipt item counted against a purchase order's lines, newest receipt first and each receipt's items in line order
  async findByPurchaseOrderId(purchaseOrderId: string): Promise<PurchaseOrderReceiptItemRow[]> {
    return this.findAllWithSelect<PurchaseOrderReceiptItemRow>({
      select: { ...this.selection(), grNumber: goodsReceipts.grNumber, receiptStatus: goodsReceipts.status },
      leftJoins: this.joins(),
      where: eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId),
      orderBy: [desc(goodsReceipts.receivedDate), desc(goodsReceipts.createdAt), asc(goodsReceiptItems.createdAt)],
    });
  }

  // Loads an item of the given receipt, throwing when it is not on it
  async findOnReceiptOrThrow(goodsReceiptId: string, itemId: string): Promise<GoodsReceiptItemRow> {
    const row = await this.findById<GoodsReceiptItemRow>(itemId, {
      select: this.selection(),
      leftJoins: this.joins(),
      where: eq(goodsReceiptItems.goodsReceiptId, goodsReceiptId),
    });
    if (!row) throw new NotFoundException('Goods receipt item not found.');
    return row;
  }

  // Loads what the item's lots, lines and serials are written against, throwing unless its receipt is a draft
  async findDraftContextOrThrow(goodsReceiptId: string, itemId: string): Promise<GoodsReceiptItemContext> {
    const [context] = await this.db
      .select({
        id: goodsReceiptItems.id,
        goodsReceiptId: goodsReceiptItems.goodsReceiptId,
        siteId: goodsReceiptItems.siteId,
        inventoryItemId: goodsReceiptItems.inventoryItemId,
        uomId: goodsReceiptItems.uomId,
        receivedQty: goodsReceiptItems.receivedQty,
        rejectedQuantity: goodsReceiptItems.rejectedQuantity,
        receiptStatus: goodsReceipts.status,
        tracking: inventoryItems.tracking,
      })
      .from(goodsReceiptItems)
      .innerJoin(goodsReceipts, eq(goodsReceipts.id, goodsReceiptItems.goodsReceiptId))
      .innerJoin(inventoryItems, eq(inventoryItems.id, goodsReceiptItems.inventoryItemId))
      .where(and(eq(goodsReceiptItems.id, itemId), eq(goodsReceiptItems.goodsReceiptId, goodsReceiptId)))
      .limit(1);
    if (!context) throw new NotFoundException('Goods receipt item not found.');
    if (context.receiptStatus !== GoodsReceiptStatusValues.DRAFT) {
      throw new BadRequestException({
        label: 'Goods Receipt Published',
        detail: 'The goods receipt is published, so its lots, lines and serials can no longer change.',
      });
    }
    return context;
  }

  // Returns the inventory items counted on a receipt
  async findInventoryItemIds(goodsReceiptId: string): Promise<string[]> {
    const rows = await this.findMany({ where: { goodsReceiptId } });
    return rows.map((row) => row.inventoryItemId);
  }

  // Returns the receipt's item tree in one query: items, then lots and lines below them by how each item is tracked
  async findTreeByReceiptId(goodsReceiptId: string): Promise<GoodsReceiptTreeNode[]> {
    const itemLines = eq(goodsReceiptLines.goodsReceiptItemId, goodsReceiptItems.id);
    const itemLots = eq(goodsReceiptLots.goodsReceiptItemId, goodsReceiptItems.id);
    const distributedQuantity = this.sumLineQuantity(itemLines);
    const acceptedQuantity = sql`${goodsReceiptItems.receivedQty} - ${goodsReceiptItems.rejectedQuantity}`;

    const node = sql<GoodsReceiptTreeNode>`json_build_object(
      'id', ${goodsReceiptItems.id},
      'name', coalesce(${inventoryItems.name}, ${goodsReceiptItems.inventoryItemId}::text),
      'kind', 'item',
      'balanced', ${this.linesBalanced(itemLines)} and ${distributedQuantity} = ${acceptedQuantity},
      'badge', concat_ws(' ', concat(trim_scale(${distributedQuantity})::text, '/', trim_scale(${acceptedQuantity})::text), ${itemUom.symbol}),
      'children', case ${inventoryItems.tracking}
        when ${InventoryTrackingValues.LOT} then ${this.lotNodes(itemLots, false)}
        when ${InventoryTrackingValues.LOT_SERIAL} then ${this.lotNodes(itemLots, true)}
        when ${InventoryTrackingValues.SERIAL} then ${this.lineNodes(itemLines)}
        else '[]'::json
      end
    )`;

    const rows = await this.db
      .select({ node })
      .from(goodsReceiptItems)
      .leftJoin(inventoryItems, eq(inventoryItems.id, goodsReceiptItems.inventoryItemId))
      .leftJoin(itemUom, eq(itemUom.id, goodsReceiptItems.uomId))
      .where(eq(goodsReceiptItems.goodsReceiptId, goodsReceiptId))
      .orderBy(asc(goodsReceiptItems.createdAt));
    return rows.map((row) => row.node);
  }

  // Inserts the given items in one statement
  async insertMany(rows: NewGoodsReceiptItem[]): Promise<void> {
    await this.db.insert(goodsReceiptItems).values(rows);
  }

  // Rejects rejecting more than was received
  assertRejectedWithinReceived(receivedQty: number, rejectedQuantity: number): void {
    if (rejectedQuantity <= receivedQty) return;
    throw new BadRequestException({
      label: 'Too Many Rejected',
      detail: `Only ${receivedQty} were received, so no more than that can be rejected.`,
      errors: [{ field: 'rejectedQuantity', message: 'More than received' }],
    });
  }

  // Selects an item with its units, PO line, earlier published receipts, distribution progress and earliest expiry
  private selection() {
    const ownLines = eq(goodsReceiptLines.goodsReceiptItemId, goodsReceiptItems.id);
    const ownLots = eq(goodsReceiptLots.goodsReceiptItemId, goodsReceiptItems.id);
    const receivedOnOtherPublishedReceipts = this.db
      .select({
        total: sql`coalesce(sum(${otherReceiptItems.receivedQty} - ${otherReceiptItems.rejectedQuantity}), 0)`,
      })
      .from(otherReceiptItems)
      .innerJoin(otherReceipts, eq(otherReceipts.id, otherReceiptItems.goodsReceiptId))
      .where(
        and(
          eq(otherReceiptItems.purchaseOrderItemId, goodsReceiptItems.purchaseOrderItemId),
          ne(otherReceiptItems.goodsReceiptId, goodsReceiptItems.goodsReceiptId),
          eq(otherReceipts.status, GoodsReceiptStatusValues.PUBLISHED),
        ),
      );
    const earliestExpiryDate = this.db
      .select({ expiryDate: goodsReceiptLots.expiryDate })
      .from(goodsReceiptLots)
      .where(ownLots)
      .orderBy(asc(goodsReceiptLots.expiryDate))
      .limit(1);
    const earliestExpiryLotNumber = this.db
      .select({ lotNumber: goodsReceiptLots.lotNumber })
      .from(goodsReceiptLots)
      .where(ownLots)
      .orderBy(asc(goodsReceiptLots.expiryDate))
      .limit(1);

    return {
      ...getColumns(goodsReceiptItems),
      inventoryItemName: inventoryItems.name,
      inventoryItemTracking: inventoryItems.tracking,
      uomSymbol: itemUom.symbol,
      uomAllowDecimal: itemUom.allowDecimal,
      primaryUomSymbol: uom.symbol,
      receivedDate: goodsReceipts.receivedDate,
      orderedQty: purchaseOrderItems.uomQty,
      expectedFreeQty: purchaseOrderItems.freeQty,
      poPrimaryUomQty: purchaseOrderItems.primaryUomQty,
      poUnitPrice: purchaseOrderItems.unitPrice,
      poTotalPrice: purchaseOrderItems.totalPrice,
      poCurrencyCode: purchaseOrderItems.currencyCode,
      poExchangeRate: purchaseOrders.exchangeRate,
      alreadyReceivedQty: sql<number>`(${receivedOnOtherPublishedReceipts})`.mapWith(Number),
      distributedQty: this.sumLineQuantity(ownLines).mapWith(Number),
      lotsCount: this.db.$count(goodsReceiptLots, ownLots),
      linesCount: this.db.$count(goodsReceiptLines, ownLines),
      unbalancedLinesCount: this.db.$count(goodsReceiptLines, and(ownLines, eq(goodsReceiptLines.isBalanced, false))),
      earliestExpiryDate: sql<string | null>`(${earliestExpiryDate})`.mapWith(goodsReceiptLots.expiryDate),
      earliestExpiryLotNumber: sql<string | null>`(${earliestExpiryLotNumber})`,
    };
  }

  // Joins the inventory item, the received and primary units, the receipt, and the purchase order line with its order
  private joins() {
    return [
      { table: inventoryItems, on: eq(inventoryItems.id, goodsReceiptItems.inventoryItemId) },
      { table: itemUom, on: eq(itemUom.id, goodsReceiptItems.uomId) },
      { table: uom, on: eq(uom.id, inventoryItems.uomId) },
      { table: goodsReceipts, on: eq(goodsReceipts.id, goodsReceiptItems.goodsReceiptId) },
      { table: purchaseOrderItems, on: eq(purchaseOrderItems.id, goodsReceiptItems.purchaseOrderItemId) },
      { table: purchaseOrders, on: eq(purchaseOrders.id, purchaseOrderItems.purchaseOrderId) },
    ];
  }

  // Sums the quantity of the lines matching the condition
  private sumLineQuantity(lines: SQL) {
    const total = this.db
      .select({ total: sql`coalesce(sum(${goodsReceiptLines.quantity}), 0)` })
      .from(goodsReceiptLines)
      .where(lines);
    return sql<number>`(${total})`;
  }

  // Whether the lines matching the condition exist and every one of them is balanced
  private linesBalanced(lines: SQL) {
    const unbalanced = this.db.$count(goodsReceiptLines, and(lines, eq(goodsReceiptLines.isBalanced, false)));
    return sql`(${this.db.$count(goodsReceiptLines, lines)} > 0 and ${unbalanced} = 0)`;
  }

  // Aggregates the lots matching the condition into tree nodes, with their lines below them when asked
  private lotNodes(lots: SQL, withLines: boolean) {
    const lotLines = eq(goodsReceiptLines.goodsReceiptLotId, goodsReceiptLots.id);
    const children = withLines ? sql`, 'children', ${this.lineNodes(lotLines)}` : sql``;
    const node = sql`json_build_object(
      'id', ${goodsReceiptLots.id},
      'name', ${goodsReceiptLots.lotNumber},
      'kind', 'lot',
      'balanced', ${this.linesBalanced(lotLines)},
      'badge', trim_scale(${this.sumLineQuantity(lotLines)})::text
      ${children}
    )`;
    const nodes = this.db
      .select({ nodes: sql`coalesce(json_agg(${node} order by ${goodsReceiptLots.createdAt}), '[]'::json)` })
      .from(goodsReceiptLots)
      .where(lots);
    return sql`(${nodes})`;
  }

  // Aggregates the lines matching the condition into tree nodes, badged with their serial progress
  private lineNodes(lines: SQL) {
    const serialCount = this.db.$count(
      goodsReceiptLineItems,
      eq(goodsReceiptLineItems.goodsReceiptLineId, goodsReceiptLines.id),
    );
    const node = sql`json_build_object(
      'id', ${goodsReceiptLines.id},
      'name', coalesce(${locations.name}, '—'),
      'kind', 'line',
      'balanced', ${goodsReceiptLines.isBalanced},
      'badge', concat(${serialCount}::text, '/', trim_scale(${goodsReceiptLines.quantity})::text)
    )`;
    const nodes = this.db
      .select({ nodes: sql`coalesce(json_agg(${node} order by ${goodsReceiptLines.createdAt}), '[]'::json)` })
      .from(goodsReceiptLines)
      .leftJoin(locations, eq(locations.id, goodsReceiptLines.locationId))
      .where(lines);
    return sql`(${nodes})`;
  }
}
