import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { and, asc, eq, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type GoodsReceiptItem,
  goodsReceiptItems,
  goodsReceiptLines,
  goodsReceiptLots,
  goodsReceipts,
  inventoryItems,
  type InventoryTracking,
  purchaseOrderItems,
  uom,
} from '@/db/schema';

export type GoodsReceiptItemWithRefs = GoodsReceiptItem & {
  inventoryItemName: string | null;
  inventoryItemTracking: InventoryTracking;
  inventoryItemUomSymbol: string | null;
  acceptedQuantity: number;
  lotsCount: number;
  linesCount: number;
  unbalancedLinesCount: number;
  poItemId: string | null;
  poOrderedQuantity: string | null;
  poReceivedQuantity: string | null;
};

@Injectable()
export class GoodsReceiptItemsRepository extends PrimaryBaseRepository<typeof goodsReceiptItems> {
  constructor(database: PrimaryDatabaseService) {
    super(database, goodsReceiptItems);
  }

  async findByReceiptId(goodsReceiptId: string): Promise<GoodsReceiptItemWithRefs[]> {
    return this.runRichSelect(eq(goodsReceiptItems.goodsReceiptId, goodsReceiptId));
  }

  async findItemById(itemId: string): Promise<GoodsReceiptItem | null> {
    const [row] = await this.db.select().from(goodsReceiptItems).where(eq(goodsReceiptItems.id, itemId));
    return row ?? null;
  }

  async findByReceiptIdAndItemId(goodsReceiptId: string, itemId: string): Promise<GoodsReceiptItem | null> {
    const [row] = await this.db
      .select()
      .from(goodsReceiptItems)
      .where(and(eq(goodsReceiptItems.goodsReceiptId, goodsReceiptId), eq(goodsReceiptItems.id, itemId)));
    return row ?? null;
  }

  async findByReceiptIdAndItemIdWithRefs(
    goodsReceiptId: string,
    itemId: string,
  ): Promise<GoodsReceiptItemWithRefs | undefined> {
    const result = await this.runRichSelect(
      and(eq(goodsReceiptItems.goodsReceiptId, goodsReceiptId), eq(goodsReceiptItems.id, itemId)),
    );
    return result[0];
  }

  async getTrackingForItem(itemId: string): Promise<InventoryTracking | null> {
    const rows = await this.db
      .select({ tracking: inventoryItems.tracking })
      .from(goodsReceiptItems)
      .innerJoin(inventoryItems, eq(goodsReceiptItems.inventoryItemId, inventoryItems.id))
      .where(eq(goodsReceiptItems.id, itemId))
      .limit(1);
    return rows[0]?.tracking ?? null;
  }

  async countByReceiptId(goodsReceiptId: string): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(goodsReceiptItems)
      .where(eq(goodsReceiptItems.goodsReceiptId, goodsReceiptId));
    return Number(row?.count ?? 0);
  }

  async findInventoryItemIds(goodsReceiptId: string): Promise<string[]> {
    const rows = await this.db
      .select({ inventoryItemId: goodsReceiptItems.inventoryItemId })
      .from(goodsReceiptItems)
      .where(eq(goodsReceiptItems.goodsReceiptId, goodsReceiptId));
    return rows.map((row) => row.inventoryItemId);
  }

  async findForTable(
    goodsReceiptId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
  ): Promise<{ result: GoodsReceiptItemWithRefs[]; count: number }> {
    const baseWhere = eq(goodsReceiptItems.goodsReceiptId, goodsReceiptId);
    const where = options.where ? and(baseWhere, options.where) : baseWhere;
    const result = await this.runRichSelect(where, options.orderBy, options.limit, options.offset);
    const [countRow] = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(goodsReceiptItems)
      .where(where);
    return { result, count: Number(countRow?.count ?? 0) };
  }

  // For a given (receiptId, inventoryItemId), check if a row already exists (for unique enforcement at write time)
  async findByReceiptAndInventoryItem(
    goodsReceiptId: string,
    inventoryItemId: string,
  ): Promise<GoodsReceiptItem | undefined> {
    const rows = await this.db
      .select()
      .from(goodsReceiptItems)
      .where(
        and(
          eq(goodsReceiptItems.goodsReceiptId, goodsReceiptId),
          eq(goodsReceiptItems.inventoryItemId, inventoryItemId),
        ),
      )
      .limit(1);
    return rows[0] as GoodsReceiptItem | undefined;
  }

  // Used by the publish flow — minimal projection: itemId, inventoryItemId, tracking, rejectedQuantity, poItemId
  async findByReceiptIdForPublish(
    goodsReceiptId: string,
  ): Promise<
    {
      id: string;
      inventoryItemId: string;
      rejectedQuantity: string;
      tracking: InventoryTracking;
      poItemId: string | null;
      poOrderedQuantity: string | null;
      poReceivedQuantity: string | null;
    }[]
  > {
    const rows = await this.db
      .select({
        id: goodsReceiptItems.id,
        inventoryItemId: goodsReceiptItems.inventoryItemId,
        rejectedQuantity: goodsReceiptItems.rejectedQuantity,
        tracking: inventoryItems.tracking,
        poItemId: purchaseOrderItems.id,
        poOrderedQuantity: purchaseOrderItems.orderedQuantity,
        poReceivedQuantity: purchaseOrderItems.receivedQuantity,
      })
      .from(goodsReceiptItems)
      .innerJoin(inventoryItems, eq(goodsReceiptItems.inventoryItemId, inventoryItems.id))
      .innerJoin(goodsReceipts, eq(goodsReceiptItems.goodsReceiptId, goodsReceipts.id))
      .leftJoin(
        purchaseOrderItems,
        and(
          eq(purchaseOrderItems.purchaseOrderId, goodsReceipts.purchaseOrderId),
          eq(purchaseOrderItems.inventoryItemId, goodsReceiptItems.inventoryItemId),
        ),
      )
      .where(eq(goodsReceiptItems.goodsReceiptId, goodsReceiptId))
      .orderBy(asc(goodsReceiptItems.createdAt));
    return rows;
  }

  private async runRichSelect(
    where: SQL | undefined,
    orderBy?: SQL[],
    limit?: number,
    offset?: number,
  ): Promise<GoodsReceiptItemWithRefs[]> {
    const acceptedQtySql = sql<string>`COALESCE((
      SELECT SUM(quantity)
      FROM vritti_core.goods_receipt_lines gl
      WHERE gl.goods_receipt_item_id = ${goodsReceiptItems.id}
    ), 0)`;
    const lotsCountSql = sql<number>`(
      SELECT COUNT(*) FROM vritti_core.goods_receipt_lots gl
      WHERE gl.goods_receipt_item_id = ${goodsReceiptItems.id}
    )`;
    const linesCountSql = sql<number>`(
      SELECT COUNT(*) FROM vritti_core.goods_receipt_lines gl
      WHERE gl.goods_receipt_item_id = ${goodsReceiptItems.id}
    )`;
    const unbalancedLinesCountSql = sql<number>`(
      SELECT COUNT(*) FROM vritti_core.goods_receipt_lines gl
      WHERE gl.goods_receipt_item_id = ${goodsReceiptItems.id} AND gl.is_balanced = false
    )`;

    const query = this.db
      .select({
        id: goodsReceiptItems.id,
        organizationId: goodsReceiptItems.organizationId,
        businessUnitId: goodsReceiptItems.businessUnitId,
        goodsReceiptId: goodsReceiptItems.goodsReceiptId,
        inventoryItemId: goodsReceiptItems.inventoryItemId,
        rejectedQuantity: goodsReceiptItems.rejectedQuantity,
        metadata: goodsReceiptItems.metadata,
        createdAt: goodsReceiptItems.createdAt,
        updatedAt: goodsReceiptItems.updatedAt,
        inventoryItemName: inventoryItems.name,
        inventoryItemTracking: inventoryItems.tracking,
        inventoryItemUomSymbol: uom.symbol,
        poItemId: purchaseOrderItems.id,
        poOrderedQuantity: purchaseOrderItems.orderedQuantity,
        poReceivedQuantity: purchaseOrderItems.receivedQuantity,
        acceptedQuantity: acceptedQtySql,
        lotsCount: lotsCountSql,
        linesCount: linesCountSql,
        unbalancedLinesCount: unbalancedLinesCountSql,
      })
      .from(goodsReceiptItems)
      .leftJoin(inventoryItems, eq(goodsReceiptItems.inventoryItemId, inventoryItems.id))
      .leftJoin(uom, eq(inventoryItems.uomId, uom.id))
      .leftJoin(goodsReceipts, eq(goodsReceiptItems.goodsReceiptId, goodsReceipts.id))
      .leftJoin(
        purchaseOrderItems,
        and(
          eq(purchaseOrderItems.purchaseOrderId, goodsReceipts.purchaseOrderId),
          eq(purchaseOrderItems.inventoryItemId, goodsReceiptItems.inventoryItemId),
        ),
      )
      .where(where ?? sql`TRUE`)
      .orderBy(...(orderBy?.length ? orderBy : [asc(goodsReceiptItems.createdAt)]));

    const finalQuery = limit !== undefined ? query.limit(limit).offset(offset ?? 0) : query;
    const rows = await finalQuery;

    return rows.map((row) => ({
      ...row,
      acceptedQuantity: Number(row.acceptedQuantity),
      lotsCount: Number(row.lotsCount ?? 0),
      linesCount: Number(row.linesCount ?? 0),
      unbalancedLinesCount: Number(row.unbalancedLinesCount ?? 0),
    })) as GoodsReceiptItemWithRefs[];
  }
}

// Suppress unused warning — `goodsReceiptLines` and `goodsReceiptLots` are kept for type-safe references in future overhauls
void goodsReceiptLines;
void goodsReceiptLots;
