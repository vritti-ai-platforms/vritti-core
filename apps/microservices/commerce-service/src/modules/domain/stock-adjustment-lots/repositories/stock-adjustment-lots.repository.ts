import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { and, asc, eq, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  stockAdjustmentLineItems,
  stockAdjustmentLines,
  type StockAdjustmentLot,
  stockAdjustmentLots,
} from '@/db/schema';

export type StockAdjustmentLotWithStats = StockAdjustmentLot & {
  linesCount: number;
  totalQuantity: number;
  unbalancedLinesCount: number;
};

@Injectable()
export class StockAdjustmentLotsRepository extends PrimaryBaseRepository<typeof stockAdjustmentLots> {
  constructor(database: PrimaryDatabaseService) {
    super(database, stockAdjustmentLots);
  }

  async findByAdjustmentId(adjustmentId: string): Promise<StockAdjustmentLotWithStats[]> {
    const rows = await this.db
      .select({
        id: stockAdjustmentLots.id,
        organizationId: stockAdjustmentLots.organizationId,
        businessUnitId: stockAdjustmentLots.businessUnitId,
        stockAdjustmentId: stockAdjustmentLots.stockAdjustmentId,
        lotNumber: stockAdjustmentLots.lotNumber,
        manufacturingDate: stockAdjustmentLots.manufacturingDate,
        expiryDate: stockAdjustmentLots.expiryDate,
        resolvedLotId: stockAdjustmentLots.resolvedLotId,
        metadata: stockAdjustmentLots.metadata,
        createdAt: stockAdjustmentLots.createdAt,
        updatedAt: stockAdjustmentLots.updatedAt,
        linesCount: sql<number>`COALESCE(COUNT(DISTINCT ${stockAdjustmentLines.id}), 0)`,
        totalQuantity: sql<string>`COALESCE(SUM(${stockAdjustmentLines.quantity}), 0)`,
        unbalancedLinesCount: sql<number>`COALESCE(SUM(CASE WHEN ${stockAdjustmentLines.isBalanced} = false THEN 1 ELSE 0 END), 0)`,
      })
      .from(stockAdjustmentLots)
      .leftJoin(stockAdjustmentLines, eq(stockAdjustmentLots.id, stockAdjustmentLines.stockAdjustmentLotId))
      .where(eq(stockAdjustmentLots.stockAdjustmentId, adjustmentId))
      .groupBy(stockAdjustmentLots.id)
      .orderBy(asc(stockAdjustmentLots.createdAt));

    return rows.map((row) => ({
      ...row,
      linesCount: Number(row.linesCount),
      totalQuantity: Number(row.totalQuantity),
      unbalancedLinesCount: Number(row.unbalancedLinesCount),
    })) as StockAdjustmentLotWithStats[];
  }

  async findById(lotId: string): Promise<StockAdjustmentLot | undefined> {
    const rows = await this.db.select().from(stockAdjustmentLots).where(eq(stockAdjustmentLots.id, lotId)).limit(1);
    return rows[0] as StockAdjustmentLot | undefined;
  }

  async findByAdjustmentIdAndNumber(
    adjustmentId: string,
    lotNumber: string,
  ): Promise<StockAdjustmentLot | undefined> {
    const rows = await this.db
      .select()
      .from(stockAdjustmentLots)
      .where(
        and(eq(stockAdjustmentLots.stockAdjustmentId, adjustmentId), eq(stockAdjustmentLots.lotNumber, lotNumber)),
      )
      .limit(1);
    return rows[0] as StockAdjustmentLot | undefined;
  }

  async createLot(data: typeof stockAdjustmentLots.$inferInsert): Promise<StockAdjustmentLot> {
    const results = await this.db.insert(stockAdjustmentLots).values(data).returning();
    return results[0] as StockAdjustmentLot;
  }

  async setResolvedLotId(lotId: string, resolvedLotId: string): Promise<void> {
    await this.db.update(stockAdjustmentLots).set({ resolvedLotId }).where(eq(stockAdjustmentLots.id, lotId));
  }

  // Counts how many line_items reference any line under this lot — used to validate deletion safety
  async countLineItemsForLot(lotId: string): Promise<number> {
    const rows = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(stockAdjustmentLineItems)
      .innerJoin(stockAdjustmentLines, eq(stockAdjustmentLineItems.stockAdjustmentLineId, stockAdjustmentLines.id))
      .where(eq(stockAdjustmentLines.stockAdjustmentLotId, lotId));
    return Number(rows[0]?.count ?? 0);
  }
}
