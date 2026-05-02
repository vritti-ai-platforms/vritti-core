import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { and, asc, desc, eq, inArray, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type GoodsReceiptLine,
  goodsReceiptItems,
  goodsReceiptLineItems,
  goodsReceiptLines,
  goodsReceiptLots,
  inventoryItems,
  InventoryTrackingValues,
  storageLocations,
} from '@/db/schema';

export type GoodsReceiptLineWithRefs = GoodsReceiptLine & {
  locationName: string | null;
  // Lot detail (for tracking='lot' or 'serial' lines):
  lotNumber: string | null;
  lotManufacturingDate: string | null;
  lotExpiryDate: string | null;
  // Computed:
  lineItemsCount: number;
};

@Injectable()
export class GoodsReceiptLinesRepository extends PrimaryBaseRepository<typeof goodsReceiptLines> {
  constructor(database: PrimaryDatabaseService) {
    super(database, goodsReceiptLines);
  }

  async findByItemId(itemId: string): Promise<GoodsReceiptLineWithRefs[]> {
    return this.runRichSelect(eq(goodsReceiptLines.goodsReceiptItemId, itemId));
  }

  async findByLotId(lotId: string): Promise<GoodsReceiptLineWithRefs[]> {
    return this.runRichSelect(eq(goodsReceiptLines.goodsReceiptLotId, lotId));
  }

  async findByReceiptId(goodsReceiptId: string): Promise<GoodsReceiptLineWithRefs[]> {
    const itemIds = await this.db
      .select({ id: goodsReceiptItems.id })
      .from(goodsReceiptItems)
      .where(eq(goodsReceiptItems.goodsReceiptId, goodsReceiptId));
    if (itemIds.length === 0) return [];
    return this.runRichSelect(
      inArray(
        goodsReceiptLines.goodsReceiptItemId,
        itemIds.map((row) => row.id),
      ),
    );
  }

  async findForTable(
    itemId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number; lotId?: string | null },
  ): Promise<{ result: GoodsReceiptLineWithRefs[]; count: number }> {
    const scopeWhere = options.lotId
      ? and(eq(goodsReceiptLines.goodsReceiptItemId, itemId), eq(goodsReceiptLines.goodsReceiptLotId, options.lotId))
      : eq(goodsReceiptLines.goodsReceiptItemId, itemId);
    const combinedWhere = options.where ? and(scopeWhere, options.where) : scopeWhere;
    const result = await this.runRichSelect(combinedWhere, options.orderBy, options.limit, options.offset);
    const [countRow] = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(goodsReceiptLines)
      .where(combinedWhere);
    return { result, count: Number(countRow?.count ?? 0) };
  }

  async findLineById(lineId: string): Promise<GoodsReceiptLine | undefined> {
    const rows = await this.db.select().from(goodsReceiptLines).where(eq(goodsReceiptLines.id, lineId));
    return rows[0] as GoodsReceiptLine | undefined;
  }

  async findByItemIdAndLineId(itemId: string, lineId: string): Promise<GoodsReceiptLineWithRefs | undefined> {
    const result = await this.runRichSelect(
      and(eq(goodsReceiptLines.goodsReceiptItemId, itemId), eq(goodsReceiptLines.id, lineId)),
    );
    return result[0];
  }

  async deleteLine(lineId: string): Promise<void> {
    await this.db.delete(goodsReceiptLines).where(eq(goodsReceiptLines.id, lineId));
  }

  async setResolvedQuant(lineId: string, resolvedQuantId: string): Promise<void> {
    await this.db.update(goodsReceiptLines).set({ resolvedQuantId }).where(eq(goodsReceiptLines.id, lineId));
  }

  async totalQuantityForItem(itemId: string, excludeLineId?: string): Promise<number> {
    const where = excludeLineId
      ? and(eq(goodsReceiptLines.goodsReceiptItemId, itemId), sql`${goodsReceiptLines.id} <> ${excludeLineId}`)
      : eq(goodsReceiptLines.goodsReceiptItemId, itemId);
    const [row] = await this.db
      .select({ total: sql<string>`COALESCE(SUM(${goodsReceiptLines.quantity}), 0)` })
      .from(goodsReceiptLines)
      .where(where);
    return Number(row?.total ?? 0);
  }

  async countByItemId(itemId: string): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(goodsReceiptLines)
      .where(eq(goodsReceiptLines.goodsReceiptItemId, itemId));
    return Number(row?.count ?? 0);
  }

  // For tracking='serial' or 'lot_serial': sync quantity to count(line_items); isBalanced is always true.
  // For other tracking types: isBalanced is always true (no derived count).
  async refreshIsBalanced(lineId: string, tracking: 'quantity' | 'lot' | 'serial' | 'lot_serial'): Promise<void> {
    if (tracking !== 'serial' && tracking !== 'lot_serial') {
      await this.db.update(goodsReceiptLines).set({ isBalanced: true }).where(eq(goodsReceiptLines.id, lineId));
      return;
    }
    await this.db
      .update(goodsReceiptLines)
      .set({
        quantity: sql<string>`COALESCE((
          SELECT COUNT(*)
          FROM vritti_core.goods_receipt_line_items li
          WHERE li.goods_receipt_line_id = ${goodsReceiptLines.id}
        ), 0)`,
        isBalanced: true,
      })
      .where(eq(goodsReceiptLines.id, lineId));
  }

  // Returns serial-tracked lines whose quantity != count(line_items). Skips quantity- and lot-tracked
  // lines entirely — those don't have line_items rows by design.
  async findUnbalancedSerialLines(
    goodsReceiptId: string,
  ): Promise<{ lineId: string; lineQuantity: number; lineItemsCount: number; delta: number }[]> {
    const rows = await this.db
      .select({
        lineId: goodsReceiptLines.id,
        lineQuantity: goodsReceiptLines.quantity,
        lineItemsCount: sql<number>`COUNT(${goodsReceiptLineItems.id})`,
      })
      .from(goodsReceiptLines)
      .innerJoin(goodsReceiptItems, eq(goodsReceiptLines.goodsReceiptItemId, goodsReceiptItems.id))
      .innerJoin(inventoryItems, eq(goodsReceiptItems.inventoryItemId, inventoryItems.id))
      .leftJoin(goodsReceiptLineItems, eq(goodsReceiptLineItems.goodsReceiptLineId, goodsReceiptLines.id))
      .where(
        and(
          eq(goodsReceiptItems.goodsReceiptId, goodsReceiptId),
          inArray(inventoryItems.tracking, [InventoryTrackingValues.SERIAL, InventoryTrackingValues.LOT_SERIAL]),
        ),
      )
      .groupBy(goodsReceiptLines.id, goodsReceiptLines.quantity);

    return rows
      .map((row) => {
        const lineQuantity = Number(row.lineQuantity);
        const lineItemsCount = Number(row.lineItemsCount ?? 0);
        return { lineId: row.lineId, lineQuantity, lineItemsCount, delta: lineQuantity - lineItemsCount };
      })
      .filter((row) => row.delta !== 0);
  }

  private async runRichSelect(
    where: SQL | undefined,
    orderBy?: SQL[],
    limit?: number,
    offset?: number,
  ): Promise<GoodsReceiptLineWithRefs[]> {
    const lineItemsCountSql = sql<number>`(
      SELECT COUNT(*) FROM vritti_core.goods_receipt_line_items li
      WHERE li.goods_receipt_line_id = ${goodsReceiptLines.id}
    )`;
    const query = this.db
      .select({
        id: goodsReceiptLines.id,
        organizationId: goodsReceiptLines.organizationId,
        businessUnitId: goodsReceiptLines.businessUnitId,
        goodsReceiptItemId: goodsReceiptLines.goodsReceiptItemId,
        goodsReceiptLotId: goodsReceiptLines.goodsReceiptLotId,
        locationId: goodsReceiptLines.locationId,
        quantity: goodsReceiptLines.quantity,
        resolvedQuantId: goodsReceiptLines.resolvedQuantId,
        isBalanced: goodsReceiptLines.isBalanced,
        metadata: goodsReceiptLines.metadata,
        createdAt: goodsReceiptLines.createdAt,
        updatedAt: goodsReceiptLines.updatedAt,
        locationName: storageLocations.name,
        lotNumber: goodsReceiptLots.lotNumber,
        lotManufacturingDate: goodsReceiptLots.manufacturingDate,
        lotExpiryDate: goodsReceiptLots.expiryDate,
        lineItemsCount: lineItemsCountSql,
      })
      .from(goodsReceiptLines)
      .leftJoin(goodsReceiptLots, eq(goodsReceiptLines.goodsReceiptLotId, goodsReceiptLots.id))
      .leftJoin(storageLocations, eq(goodsReceiptLines.locationId, storageLocations.id))
      .where(where ?? sql`TRUE`)
      .orderBy(...(orderBy?.length ? orderBy : [desc(goodsReceiptLines.createdAt)]));

    const finalQuery = limit !== undefined ? query.limit(limit).offset(offset ?? 0) : query;
    const rows = await finalQuery;

    return rows.map((row) => ({
      ...row,
      lineItemsCount: Number(row.lineItemsCount ?? 0),
    })) as GoodsReceiptLineWithRefs[];
  }
}

void asc;
