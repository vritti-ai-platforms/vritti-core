import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService, type TypedDrizzleClient } from '@vritti/api-sdk';
import { and, desc, eq, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { stockAdjustmentLineItems, type StockAdjustmentLine, stockAdjustmentLines, storageLocations } from '@/db/schema';

@Injectable()
export class StockAdjustmentLinesRepository extends PrimaryBaseRepository<typeof stockAdjustmentLines> {
  constructor(database: PrimaryDatabaseService) {
    super(database, stockAdjustmentLines);
  }

  async findByAdjustmentId(adjustmentId: string): Promise<(StockAdjustmentLine & { locationName: string | null })[]> {
    const rows = await this.db
      .select({
        id: stockAdjustmentLines.id,
        organizationId: stockAdjustmentLines.organizationId,
        businessUnitId: stockAdjustmentLines.businessUnitId,
        stockAdjustmentId: stockAdjustmentLines.stockAdjustmentId,
        createdById: stockAdjustmentLines.createdById,
        batchId: stockAdjustmentLines.batchId,
        locationId: stockAdjustmentLines.locationId,
        quantity: stockAdjustmentLines.quantity,
        batchNumber: stockAdjustmentLines.batchNumber,
        isBalanced: stockAdjustmentLines.isBalanced,
        manufacturingDate: stockAdjustmentLines.manufacturingDate,
        expiryDate: stockAdjustmentLines.expiryDate,
        createdAt: stockAdjustmentLines.createdAt,
        updatedAt: stockAdjustmentLines.updatedAt,
        locationName: storageLocations.name,
      })
      .from(stockAdjustmentLines)
      .leftJoin(storageLocations, eq(stockAdjustmentLines.locationId, storageLocations.id))
      .where(eq(stockAdjustmentLines.stockAdjustmentId, adjustmentId))
      .orderBy(desc(stockAdjustmentLines.createdAt));

    return rows as (StockAdjustmentLine & { locationName: string | null })[];
  }

  async findForTable(
    adjustmentId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
  ): Promise<{ result: (StockAdjustmentLine & { locationName: string | null })[]; count: number }> {
    const baseWhere = eq(stockAdjustmentLines.stockAdjustmentId, adjustmentId);
    const combinedWhere = options.where ? and(baseWhere, options.where) : baseWhere;

    return this.findAllAndCount<StockAdjustmentLine & { locationName: string | null }>({
      select: {
        id: stockAdjustmentLines.id,
        organizationId: stockAdjustmentLines.organizationId,
        businessUnitId: stockAdjustmentLines.businessUnitId,
        stockAdjustmentId: stockAdjustmentLines.stockAdjustmentId,
        createdById: stockAdjustmentLines.createdById,
        batchId: stockAdjustmentLines.batchId,
        locationId: stockAdjustmentLines.locationId,
        quantity: stockAdjustmentLines.quantity,
        batchNumber: stockAdjustmentLines.batchNumber,
        isBalanced: stockAdjustmentLines.isBalanced,
        manufacturingDate: stockAdjustmentLines.manufacturingDate,
        expiryDate: stockAdjustmentLines.expiryDate,
        createdAt: stockAdjustmentLines.createdAt,
        updatedAt: stockAdjustmentLines.updatedAt,
        locationName: storageLocations.name,
      },
      leftJoin: { table: storageLocations, on: eq(stockAdjustmentLines.locationId, storageLocations.id) },
      where: combinedWhere,
      orderBy: options.orderBy?.length ? options.orderBy : [desc(stockAdjustmentLines.createdAt)],
      limit: options.limit,
      offset: options.offset,
    });
  }

  async findLineById(lineId: string): Promise<StockAdjustmentLine | undefined> {
    const rows = await this.db.select().from(stockAdjustmentLines).where(eq(stockAdjustmentLines.id, lineId));

    return rows[0] as StockAdjustmentLine | undefined;
  }

  async findByAdjustmentIdAndLineId(
    adjustmentId: string,
    lineId: string,
  ): Promise<(StockAdjustmentLine & { locationName: string | null }) | undefined> {
    const rows = await this.db
      .select({
        id: stockAdjustmentLines.id,
        organizationId: stockAdjustmentLines.organizationId,
        businessUnitId: stockAdjustmentLines.businessUnitId,
        stockAdjustmentId: stockAdjustmentLines.stockAdjustmentId,
        createdById: stockAdjustmentLines.createdById,
        batchId: stockAdjustmentLines.batchId,
        locationId: stockAdjustmentLines.locationId,
        quantity: stockAdjustmentLines.quantity,
        batchNumber: stockAdjustmentLines.batchNumber,
        isBalanced: stockAdjustmentLines.isBalanced,
        manufacturingDate: stockAdjustmentLines.manufacturingDate,
        expiryDate: stockAdjustmentLines.expiryDate,
        createdAt: stockAdjustmentLines.createdAt,
        updatedAt: stockAdjustmentLines.updatedAt,
        locationName: storageLocations.name,
      })
      .from(stockAdjustmentLines)
      .leftJoin(storageLocations, eq(stockAdjustmentLines.locationId, storageLocations.id))
      .where(and(eq(stockAdjustmentLines.stockAdjustmentId, adjustmentId), eq(stockAdjustmentLines.id, lineId)));

    return rows[0] as (StockAdjustmentLine & { locationName: string | null }) | undefined;
  }

  async deleteLine(lineId: string): Promise<void> {
    await this.db.delete(stockAdjustmentLines).where(eq(stockAdjustmentLines.id, lineId));
  }

  async updateLineWithBatchInTx(
    tx: TypedDrizzleClient,
    lineId: string,
    batchId: string,
    batchNumber: string,
  ): Promise<void> {
    await tx.update(stockAdjustmentLines).set({ batchId, batchNumber }).where(eq(stockAdjustmentLines.id, lineId));
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

  async refreshIsBalanced(lineId: string): Promise<void> {
    await this.db
      .update(stockAdjustmentLines)
      .set({
        isBalanced: sql<boolean>`(
          COALESCE((
            SELECT COUNT(*)
            FROM vritti_core.stock_adjustment_line_items li
            WHERE li.stock_adjustment_line_id = ${stockAdjustmentLines.id}
          ), 0) > 0
          AND COALESCE((
            SELECT SUM(li.quantity)
            FROM vritti_core.stock_adjustment_line_items li
            WHERE li.stock_adjustment_line_id = ${stockAdjustmentLines.id}
          ), 0) = ${stockAdjustmentLines.quantity}
        )`,
      })
      .where(eq(stockAdjustmentLines.id, lineId));
  }

  async validateLineByAdjustmentId(
    adjustmentId: string,
  ): Promise<
    {
      lineId: string;
      lineQuantity: number;
      lineItemsCount: number;
      lineItemsQuantitySum: number;
      delta: number;
    }[]
  > {
    const rows = await this.db
      .select({
        lineId: stockAdjustmentLines.id,
        lineQuantity: stockAdjustmentLines.quantity,
        lineItemsCount: sql<number>`COUNT(${stockAdjustmentLineItems.id})`,
        lineItemsQuantitySum: sql<string>`COALESCE(SUM(${stockAdjustmentLineItems.quantity}), 0)`,
      })
      .from(stockAdjustmentLines)
      .leftJoin(stockAdjustmentLineItems, eq(stockAdjustmentLineItems.stockAdjustmentLineId, stockAdjustmentLines.id))
      .where(eq(stockAdjustmentLines.stockAdjustmentId, adjustmentId))
      .groupBy(stockAdjustmentLines.id, stockAdjustmentLines.quantity);

    return rows
      .map((row) => {
        const lineQuantity = Number(row.lineQuantity);
        const lineItemsCount = Number(row.lineItemsCount ?? 0);
        const lineItemsQuantitySum = Number(row.lineItemsQuantitySum ?? 0);
        return {
          lineId: row.lineId,
          lineQuantity,
          lineItemsCount,
          lineItemsQuantitySum,
          delta: Number((lineQuantity - lineItemsQuantitySum).toFixed(3)),
        };
      })
      .filter((row) => row.lineItemsCount < 1 || row.delta !== 0);
  }
}
