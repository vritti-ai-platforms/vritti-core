import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { and, desc, eq, inArray, isNull, ne, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type GoodsReceiptLine,
  goodsReceiptItems,
  goodsReceiptLineItems,
  goodsReceiptLines,
  goodsReceiptLots,
  type InventoryTracking,
  InventoryTrackingValues,
  inventoryItems,
  locations,
  uom,
} from '@/db/schema';

export type GoodsReceiptLineWithRefs = GoodsReceiptLine & {
  locationName: string | null;
  locationPath: string | null;
  // Lot detail (for tracking='lot' or 'serial' lines):
  lotNumber: string | null;
  lotManufacturingDate: string | null;
  lotExpiryDate: string | null;
  lotMrp: bigint | null;
  // Symbol of the inventory item's primary UOM (for cross-UOM display alongside primaryUomQty):
  primaryUomSymbol: string | null;
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
    const lineItemsCountSql = sql<number>`(
      SELECT COUNT(*) FROM ${goodsReceiptLineItems}
      WHERE ${goodsReceiptLineItems.goodsReceiptLineId} = ${goodsReceiptLines.id}
    )`.mapWith(Number);
    const { result, count } = await this.findAllAndCount<GoodsReceiptLineWithRefs>({
      select: {
        id: goodsReceiptLines.id,
        organizationId: goodsReceiptLines.organizationId,
        businessUnitId: goodsReceiptLines.businessUnitId,
        goodsReceiptItemId: goodsReceiptLines.goodsReceiptItemId,
        goodsReceiptLotId: goodsReceiptLines.goodsReceiptLotId,
        locationId: goodsReceiptLines.locationId,
        quantity: goodsReceiptLines.quantity,
        primaryUomQty: goodsReceiptLines.primaryUomQty,
        resolvedQuantId: goodsReceiptLines.resolvedQuantId,
        isBalanced: goodsReceiptLines.isBalanced,
        metadata: goodsReceiptLines.metadata,
        createdAt: goodsReceiptLines.createdAt,
        updatedAt: goodsReceiptLines.updatedAt,
        locationName: locations.name,
        locationPath: locations.pathBreadcrumb,
        lotNumber: goodsReceiptLots.lotNumber,
        lotManufacturingDate: goodsReceiptLots.manufacturingDate,
        lotExpiryDate: goodsReceiptLots.expiryDate,
        lotMrp: goodsReceiptLots.mrp,
        primaryUomSymbol: uom.symbol,
        lineItemsCount: lineItemsCountSql,
      },
      leftJoins: [
        { table: goodsReceiptLots, on: eq(goodsReceiptLines.goodsReceiptLotId, goodsReceiptLots.id) },
        { table: locations, on: eq(goodsReceiptLines.locationId, locations.id) },
        { table: goodsReceiptItems, on: eq(goodsReceiptLines.goodsReceiptItemId, goodsReceiptItems.id) },
        { table: inventoryItems, on: eq(goodsReceiptItems.inventoryItemId, inventoryItems.id) },
        { table: uom, on: eq(inventoryItems.uomId, uom.id) },
      ],
      where: combinedWhere,
      orderBy: options.orderBy?.length ? options.orderBy : [desc(goodsReceiptLines.createdAt)],
      limit: options.limit,
      offset: options.offset,
    });
    return { result, count };
  }

  async findByItemIdAndLineId(itemId: string, lineId: string): Promise<GoodsReceiptLineWithRefs | undefined> {
    const result = await this.runRichSelect(
      and(eq(goodsReceiptLines.goodsReceiptItemId, itemId), eq(goodsReceiptLines.id, lineId)),
    );
    return result[0];
  }

  // Finds a line by (item, lot, location) for the duplicate-line guard
  async findOneByItemLotLocation(args: {
    itemId: string;
    goodsReceiptLotId: string | null;
    locationId: string;
    excludeLineId?: string;
  }): Promise<{ id: string } | undefined> {
    const conditions: SQL[] = [
      eq(goodsReceiptLines.goodsReceiptItemId, args.itemId),
      eq(goodsReceiptLines.locationId, args.locationId),
      args.goodsReceiptLotId === null
        ? isNull(goodsReceiptLines.goodsReceiptLotId)
        : eq(goodsReceiptLines.goodsReceiptLotId, args.goodsReceiptLotId),
    ];
    if (args.excludeLineId) conditions.push(ne(goodsReceiptLines.id, args.excludeLineId));
    const [row] = await this.db
      .select({ id: goodsReceiptLines.id })
      .from(goodsReceiptLines)
      .where(and(...conditions))
      .limit(1);
    return row;
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

  // Recomputes isBalanced for a line, syncing serial-tracked lines to their line-item count
  async refreshIsBalanced(lineId: string, tracking: InventoryTracking): Promise<void> {
    if (tracking !== 'serial' && tracking !== 'lot_serial') {
      await this.db.update(goodsReceiptLines).set({ isBalanced: true }).where(eq(goodsReceiptLines.id, lineId));
      return;
    }
    // Flip isBalanced once the serial count matches the declared quantity
    await this.db
      .update(goodsReceiptLines)
      .set({
        isBalanced: sql<boolean>`${goodsReceiptLines.quantity} = COALESCE((
          SELECT COUNT(*)
          FROM ${goodsReceiptLineItems}
          WHERE ${goodsReceiptLineItems.goodsReceiptLineId} = ${goodsReceiptLines.id}
        ), 0)`,
      })
      .where(eq(goodsReceiptLines.id, lineId));
  }

  // Returns serial-tracked lines whose quantity differs from their line-item count
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
      SELECT COUNT(*) FROM ${goodsReceiptLineItems}
      WHERE ${goodsReceiptLineItems.goodsReceiptLineId} = ${goodsReceiptLines.id}
    )`.mapWith(Number);
    const query = this.db
      .select({
        id: goodsReceiptLines.id,
        organizationId: goodsReceiptLines.organizationId,
        businessUnitId: goodsReceiptLines.businessUnitId,
        goodsReceiptItemId: goodsReceiptLines.goodsReceiptItemId,
        goodsReceiptLotId: goodsReceiptLines.goodsReceiptLotId,
        locationId: goodsReceiptLines.locationId,
        quantity: goodsReceiptLines.quantity,
        primaryUomQty: goodsReceiptLines.primaryUomQty,
        resolvedQuantId: goodsReceiptLines.resolvedQuantId,
        isBalanced: goodsReceiptLines.isBalanced,
        metadata: goodsReceiptLines.metadata,
        createdAt: goodsReceiptLines.createdAt,
        updatedAt: goodsReceiptLines.updatedAt,
        locationName: locations.name,
        locationPath: locations.pathBreadcrumb,
        lotNumber: goodsReceiptLots.lotNumber,
        lotManufacturingDate: goodsReceiptLots.manufacturingDate,
        lotExpiryDate: goodsReceiptLots.expiryDate,
        lotMrp: goodsReceiptLots.mrp,
        primaryUomSymbol: uom.symbol,
        lineItemsCount: lineItemsCountSql,
      })
      .from(goodsReceiptLines)
      .leftJoin(goodsReceiptLots, eq(goodsReceiptLines.goodsReceiptLotId, goodsReceiptLots.id))
      .leftJoin(locations, eq(goodsReceiptLines.locationId, locations.id))
      .leftJoin(goodsReceiptItems, eq(goodsReceiptLines.goodsReceiptItemId, goodsReceiptItems.id))
      .leftJoin(inventoryItems, eq(goodsReceiptItems.inventoryItemId, inventoryItems.id))
      .leftJoin(uom, eq(inventoryItems.uomId, uom.id))
      .where(where ?? sql`TRUE`)
      .orderBy(...(orderBy?.length ? orderBy : [desc(goodsReceiptLines.createdAt)]));

    const finalQuery = limit !== undefined ? query.limit(limit).offset(offset ?? 0) : query;
    const rows = await finalQuery;

    return rows as GoodsReceiptLineWithRefs[];
  }
}
