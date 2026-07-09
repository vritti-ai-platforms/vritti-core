import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { aliasedTable, and, desc, eq, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type InventoryTracking,
  InventoryTrackingValues,
  inventoryItemLots,
  inventoryItemQuants,
  locations,
  type StockAdjustmentLine,
  stockAdjustmentLineItems,
  stockAdjustmentLines,
  stockAdjustmentLots,
  uom,
} from '@/db/schema';

const quantLocations = aliasedTable(locations, 'quant_locations');
export { quantLocations };

export type StockAdjustmentLineWithRefs = StockAdjustmentLine & {
  locationName: string | null;
  locationPath: string | null;
  // UOM (always set):
  uomName: string | null;
  uomSymbol: string | null;
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
    const lineItemsCountSql = sql<number>`(
      SELECT COUNT(*) FROM ${stockAdjustmentLineItems}
      WHERE ${stockAdjustmentLineItems.stockAdjustmentLineId} = ${stockAdjustmentLines.id}
    )`.mapWith(Number);
    const { result, count } = await this.findAllAndCount<StockAdjustmentLineWithRefs>({
      select: {
        id: stockAdjustmentLines.id,
        organizationId: stockAdjustmentLines.organizationId,
        businessUnitId: stockAdjustmentLines.businessUnitId,
        stockAdjustmentId: stockAdjustmentLines.stockAdjustmentId,
        stockAdjustmentLotId: stockAdjustmentLines.stockAdjustmentLotId,
        locationId: stockAdjustmentLines.locationId,
        quantId: stockAdjustmentLines.quantId,
        uomId: stockAdjustmentLines.uomId,
        uomName: uom.name,
        uomSymbol: uom.symbol,
        primaryUomQty: stockAdjustmentLines.primaryUomQty,
        uomQty: stockAdjustmentLines.uomQty,
        resolvedQuantId: stockAdjustmentLines.resolvedQuantId,
        isBalanced: stockAdjustmentLines.isBalanced,
        createdAt: stockAdjustmentLines.createdAt,
        updatedAt: stockAdjustmentLines.updatedAt,
        locationName: locations.name,
        locationPath: locations.pathBreadcrumb,
        lotNumber: stockAdjustmentLots.lotNumber,
        lotManufacturingDate: stockAdjustmentLots.manufacturingDate,
        lotExpiryDate: stockAdjustmentLots.expiryDate,
        quantLotNumber: inventoryItemLots.lotNumber,
        quantLocationId: inventoryItemQuants.locationId,
        quantLocationName: quantLocations.name,
        quantLocationPath: quantLocations.pathBreadcrumb,
        quantTotalQuantity: inventoryItemQuants.quantity,
        quantReservedQuantity: inventoryItemQuants.reservedQuantity,
        lineItemsCount: lineItemsCountSql,
      },
      leftJoins: [
        { table: stockAdjustmentLots, on: eq(stockAdjustmentLines.stockAdjustmentLotId, stockAdjustmentLots.id) },
        { table: locations, on: eq(stockAdjustmentLines.locationId, locations.id) },
        { table: inventoryItemQuants, on: eq(stockAdjustmentLines.quantId, inventoryItemQuants.id) },
        { table: inventoryItemLots, on: eq(inventoryItemQuants.lotId, inventoryItemLots.id) },
        { table: uom, on: eq(stockAdjustmentLines.uomId, uom.id) },
        { table: quantLocations, on: eq(inventoryItemQuants.locationId, quantLocations.id) },
      ],
      where: combinedWhere,
      orderBy: options.orderBy?.length ? options.orderBy : [desc(stockAdjustmentLines.createdAt)],
      limit: options.limit,
      offset: options.offset,
    });
    return { result, count };
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

  async findOneByLotLocationUom(params: {
    adjustmentId: string;
    stockAdjustmentLotId: string | null;
    locationId: string;
    uomId: string;
  }): Promise<{ id: string } | undefined> {
    return this.model.findFirst({
      where: {
        stockAdjustmentId: params.adjustmentId,
        stockAdjustmentLotId: params.stockAdjustmentLotId ?? undefined,
        locationId: params.locationId,
        uomId: params.uomId,
      },
    });
  }

  async findByAdjustmentIdAndQuantId(adjustmentId: string, quantId: string): Promise<{ id: string } | undefined> {
    return this.model.findFirst({ where: { stockAdjustmentId: adjustmentId, quantId } });
  }

  async setResolvedQuant(lineId: string, resolvedQuantId: string): Promise<void> {
    await this.db.update(stockAdjustmentLines).set({ resolvedQuantId }).where(eq(stockAdjustmentLines.id, lineId));
  }

  // Snapshots the write-off (sourceQuant.unit_cost × primary_uom_qty) onto a deduct-type
  // SA line at publish time. PR 4. Loss reporting and period-end queries read these columns
  // directly so they don't have to re-join to the quant's cost history.
  async setWriteOff(lineId: string, amount: bigint, currency: string): Promise<void> {
    await this.db
      .update(stockAdjustmentLines)
      .set({ writeOffAmount: amount, writeOffCurrency: currency })
      .where(eq(stockAdjustmentLines.id, lineId));
  }

  async totalQuantityForAdjustment(adjustmentId: string): Promise<number> {
    const [result] = await this.db
      .select({
        total: sql<string>`COALESCE(SUM(${stockAdjustmentLines.primaryUomQty}), 0)`,
      })
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

  async refreshIsBalanced(lineId: string, tracking: InventoryTracking): Promise<void> {
    if (tracking !== InventoryTrackingValues.SERIAL && tracking !== InventoryTrackingValues.LOT_SERIAL) return;
    await this.db
      .update(stockAdjustmentLines)
      .set({
        isBalanced: sql`(
          SELECT COUNT(*) FROM ${stockAdjustmentLineItems}
          WHERE ${stockAdjustmentLineItems.stockAdjustmentLineId} = ${stockAdjustmentLines.id}
        ) = ${stockAdjustmentLines.uomQty}`,
      })
      .where(eq(stockAdjustmentLines.id, lineId));
  }

  // Returns lines with mismatch (line_items count != uomQty) — for tracking='serial' validation at publish
  async findUnbalancedItemLines(
    adjustmentId: string,
  ): Promise<{ lineId: string; lineUomQty: number; lineItemsCount: number; delta: number }[]> {
    const rows = await this.db
      .select({
        lineId: stockAdjustmentLines.id,
        lineUomQty: stockAdjustmentLines.uomQty,
        lineItemsCount: sql<number>`COUNT(${stockAdjustmentLineItems.id})`,
      })
      .from(stockAdjustmentLines)
      .leftJoin(stockAdjustmentLineItems, eq(stockAdjustmentLineItems.stockAdjustmentLineId, stockAdjustmentLines.id))
      .where(eq(stockAdjustmentLines.stockAdjustmentId, adjustmentId))
      .groupBy(stockAdjustmentLines.id, stockAdjustmentLines.uomQty);

    return rows
      .map((row) => {
        const lineUomQty = Number(row.lineUomQty);
        const lineItemsCount = Number(row.lineItemsCount ?? 0);
        return { lineId: row.lineId, lineUomQty, lineItemsCount, delta: lineUomQty - lineItemsCount };
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
      SELECT COUNT(*) FROM ${stockAdjustmentLineItems}
      WHERE ${stockAdjustmentLineItems.stockAdjustmentLineId} = ${stockAdjustmentLines.id}
    )`.mapWith(Number);
    const query = this.db
      .select({
        id: stockAdjustmentLines.id,
        organizationId: stockAdjustmentLines.organizationId,
        businessUnitId: stockAdjustmentLines.businessUnitId,
        stockAdjustmentId: stockAdjustmentLines.stockAdjustmentId,
        stockAdjustmentLotId: stockAdjustmentLines.stockAdjustmentLotId,
        locationId: stockAdjustmentLines.locationId,
        quantId: stockAdjustmentLines.quantId,
        uomId: stockAdjustmentLines.uomId,
        uomName: uom.name,
        uomSymbol: uom.symbol,
        primaryUomQty: stockAdjustmentLines.primaryUomQty,
        uomQty: stockAdjustmentLines.uomQty,
        resolvedQuantId: stockAdjustmentLines.resolvedQuantId,
        isBalanced: stockAdjustmentLines.isBalanced,
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
        quantLocationName: quantLocations.name,
        quantLocationPath: quantLocations.pathBreadcrumb,
        quantTotalQuantity: inventoryItemQuants.quantity,
        quantReservedQuantity: inventoryItemQuants.reservedQuantity,
        lineItemsCount: lineItemsCountSql,
      })
      .from(stockAdjustmentLines)
      .leftJoin(stockAdjustmentLots, eq(stockAdjustmentLines.stockAdjustmentLotId, stockAdjustmentLots.id))
      .leftJoin(locations, eq(stockAdjustmentLines.locationId, locations.id))
      .leftJoin(inventoryItemQuants, eq(stockAdjustmentLines.quantId, inventoryItemQuants.id))
      .leftJoin(inventoryItemLots, eq(inventoryItemQuants.lotId, inventoryItemLots.id))
      .leftJoin(uom, eq(stockAdjustmentLines.uomId, uom.id))
      .leftJoin(quantLocations, eq(inventoryItemQuants.locationId, quantLocations.id))
      .where(where ?? sql`TRUE`)
      .orderBy(...(orderBy?.length ? orderBy : [desc(stockAdjustmentLines.createdAt)]));

    const finalQuery = limit !== undefined ? query.limit(limit).offset(offset ?? 0) : query;
    const rows = await finalQuery;

    return rows as StockAdjustmentLineWithRefs[];
  }
}
