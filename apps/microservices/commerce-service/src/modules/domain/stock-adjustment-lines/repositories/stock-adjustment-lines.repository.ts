import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { and, asc, desc, eq, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  inventoryItemLots,
  inventoryItemQuants,
  stockAdjustmentLineItems,
  type StockAdjustmentLine,
  stockAdjustmentLines,
  stockAdjustmentLots,
  locations,
} from '@/db/schema';

export type StockAdjustmentLineWithRefs = StockAdjustmentLine & {
  locationName: string | null;
  locationPath: string | null;
  // Source quant detail (for deduct lines):
  quantLotNumber: string | null;
  quantLocationId: string | null;
  quantLocationName: string | null;
  quantLocationPath: string | null;
  quantTotalQuantity: string | null;
  quantReservedQuantity: string | null;
  // Lot detail (for OPENING+lot/item lines):
  lotNumber: string | null;
  lotManufacturingDate: string | null;
  lotExpiryDate: string | null;
  // Computed:
  lineItemsCount: number;
};

@Injectable()
export class StockAdjustmentLinesRepository extends PrimaryBaseRepository<typeof stockAdjustmentLines> {
  constructor(database: PrimaryDatabaseService) {
    super(database, stockAdjustmentLines);
  }

  async findByAdjustmentId(adjustmentId: string): Promise<StockAdjustmentLineWithRefs[]> {
    return this.runRichSelect(eq(stockAdjustmentLines.stockAdjustmentId, adjustmentId));
  }

  async findByLotId(lotId: string): Promise<StockAdjustmentLineWithRefs[]> {
    return this.runRichSelect(eq(stockAdjustmentLines.stockAdjustmentLotId, lotId));
  }

  async findForTable(
    adjustmentId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number; lotId?: string | null },
  ): Promise<{ result: StockAdjustmentLineWithRefs[]; count: number }> {
    const scopeWhere = options.lotId
      ? and(
          eq(stockAdjustmentLines.stockAdjustmentId, adjustmentId),
          eq(stockAdjustmentLines.stockAdjustmentLotId, options.lotId),
        )
      : eq(stockAdjustmentLines.stockAdjustmentId, adjustmentId);
    const combinedWhere = options.where ? and(scopeWhere, options.where) : scopeWhere;
    const result = await this.runRichSelect(combinedWhere, options.orderBy, options.limit, options.offset);
    const [countRow] = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(stockAdjustmentLines)
      .where(combinedWhere);
    return { result, count: Number(countRow?.count ?? 0) };
  }

  async findLineById(lineId: string): Promise<StockAdjustmentLine | undefined> {
    const rows = await this.db.select().from(stockAdjustmentLines).where(eq(stockAdjustmentLines.id, lineId));
    return rows[0] as StockAdjustmentLine | undefined;
  }

  async findByAdjustmentIdAndLineId(
    adjustmentId: string,
    lineId: string,
  ): Promise<StockAdjustmentLineWithRefs | undefined> {
    const result = await this.runRichSelect(
      and(eq(stockAdjustmentLines.stockAdjustmentId, adjustmentId), eq(stockAdjustmentLines.id, lineId)),
    );
    return result[0];
  }

  async deleteLine(lineId: string): Promise<void> {
    await this.db.delete(stockAdjustmentLines).where(eq(stockAdjustmentLines.id, lineId));
  }

  async setResolvedQuant(lineId: string, resolvedQuantId: string): Promise<void> {
    await this.db.update(stockAdjustmentLines).set({ resolvedQuantId }).where(eq(stockAdjustmentLines.id, lineId));
  }

  async totalQuantityForAdjustment(adjustmentId: string): Promise<number> {
    const [result] = await this.db
      .select({ total: sql<string>`COALESCE(SUM(${stockAdjustmentLines.quantity}), 0)` })
      .from(stockAdjustmentLines)
      .where(eq(stockAdjustmentLines.stockAdjustmentId, adjustmentId));
    return Number(result?.total ?? 0);
  }

  async countByAdjustmentId(adjustmentId: string): Promise<number> {
    const [result] = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(stockAdjustmentLines)
      .where(eq(stockAdjustmentLines.stockAdjustmentId, adjustmentId));
    return Number(result?.count ?? 0);
  }

  // For tracking='serial' or 'lot_serial': sync quantity to count(line_items); isBalanced is always true.
  // For other tracking types: isBalanced is always true (no derived count).
  async refreshIsBalanced(lineId: string, tracking: 'quantity' | 'lot' | 'serial' | 'lot_serial'): Promise<void> {
    if (tracking !== 'serial' && tracking !== 'lot_serial') {
      await this.db.update(stockAdjustmentLines).set({ isBalanced: true }).where(eq(stockAdjustmentLines.id, lineId));
      return;
    }
    await this.db
      .update(stockAdjustmentLines)
      .set({
        quantity: sql<string>`COALESCE((
          SELECT COUNT(*)
          FROM vritti_core.stock_adjustment_line_items li
          WHERE li.stock_adjustment_line_id = ${stockAdjustmentLines.id}
        ), 0)`,
        isBalanced: true,
      })
      .where(eq(stockAdjustmentLines.id, lineId));
  }

  // Returns lines with mismatch (line_items count != quantity) — for tracking='serial' validation at publish
  async findUnbalancedItemLines(
    adjustmentId: string,
  ): Promise<{ lineId: string; lineQuantity: number; lineItemsCount: number; delta: number }[]> {
    const rows = await this.db
      .select({
        lineId: stockAdjustmentLines.id,
        lineQuantity: stockAdjustmentLines.quantity,
        lineItemsCount: sql<number>`COUNT(${stockAdjustmentLineItems.id})`,
      })
      .from(stockAdjustmentLines)
      .leftJoin(stockAdjustmentLineItems, eq(stockAdjustmentLineItems.stockAdjustmentLineId, stockAdjustmentLines.id))
      .where(eq(stockAdjustmentLines.stockAdjustmentId, adjustmentId))
      .groupBy(stockAdjustmentLines.id, stockAdjustmentLines.quantity);

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
  ): Promise<StockAdjustmentLineWithRefs[]> {
    const lineItemsCountSql = sql<number>`(
      SELECT COUNT(*) FROM vritti_core.stock_adjustment_line_items li
      WHERE li.stock_adjustment_line_id = ${stockAdjustmentLines.id}
    )`;
    const query = this.db
      .select({
        id: stockAdjustmentLines.id,
        organizationId: stockAdjustmentLines.organizationId,
        businessUnitId: stockAdjustmentLines.businessUnitId,
        stockAdjustmentId: stockAdjustmentLines.stockAdjustmentId,
        createdById: stockAdjustmentLines.createdById,
        stockAdjustmentLotId: stockAdjustmentLines.stockAdjustmentLotId,
        locationId: stockAdjustmentLines.locationId,
        quantId: stockAdjustmentLines.quantId,
        quantity: stockAdjustmentLines.quantity,
        resolvedQuantId: stockAdjustmentLines.resolvedQuantId,
        isBalanced: stockAdjustmentLines.isBalanced,
        metadata: stockAdjustmentLines.metadata,
        createdAt: stockAdjustmentLines.createdAt,
        updatedAt: stockAdjustmentLines.updatedAt,
        locationName: locations.name,
        locationPath: locations.pathBreadcrumb,
        // Lot info (for OPENING register lines):
        lotNumber: stockAdjustmentLots.lotNumber,
        lotManufacturingDate: stockAdjustmentLots.manufacturingDate,
        lotExpiryDate: stockAdjustmentLots.expiryDate,
        // Source quant info (for deduct lines):
        quantLotNumber: inventoryItemLots.lotNumber,
        quantLocationId: inventoryItemQuants.locationId,
        quantLocationName: sql<string | null>`(
          SELECT name FROM vritti_core.locations WHERE id = ${inventoryItemQuants.locationId}
        )`,
        quantLocationPath: sql<string | null>`(
          SELECT path_breadcrumb FROM vritti_core.locations WHERE id = ${inventoryItemQuants.locationId}
        )`,
        quantTotalQuantity: inventoryItemQuants.quantity,
        quantReservedQuantity: inventoryItemQuants.reservedQuantity,
        lineItemsCount: lineItemsCountSql,
      })
      .from(stockAdjustmentLines)
      .leftJoin(stockAdjustmentLots, eq(stockAdjustmentLines.stockAdjustmentLotId, stockAdjustmentLots.id))
      .leftJoin(locations, eq(stockAdjustmentLines.locationId, locations.id))
      .leftJoin(inventoryItemQuants, eq(stockAdjustmentLines.quantId, inventoryItemQuants.id))
      .leftJoin(inventoryItemLots, eq(inventoryItemQuants.lotId, inventoryItemLots.id))
      .where(where ?? sql`TRUE`)
      .orderBy(...(orderBy?.length ? orderBy : [desc(stockAdjustmentLines.createdAt)]));

    const finalQuery = limit !== undefined ? query.limit(limit).offset(offset ?? 0) : query;
    const rows = await finalQuery;

    return rows.map((row) => ({
      ...row,
      lineItemsCount: Number(row.lineItemsCount ?? 0),
    })) as StockAdjustmentLineWithRefs[];
  }
}

// Suppress unused import warning — `asc` is exported for future ordering needs
void asc;
