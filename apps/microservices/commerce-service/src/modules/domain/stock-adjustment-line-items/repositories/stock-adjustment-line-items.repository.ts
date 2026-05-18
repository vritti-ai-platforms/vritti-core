import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { and, asc, eq, inArray, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { stockAdjustmentLineItems, stockAdjustmentLines, type StockAdjustmentLineItem } from '@/db/schema';

@Injectable()
export class StockAdjustmentLineItemsRepository extends PrimaryBaseRepository<typeof stockAdjustmentLineItems> {
  constructor(database: PrimaryDatabaseService) {
    super(database, stockAdjustmentLineItems);
  }

  async findByAdjustmentId(adjustmentId: string): Promise<StockAdjustmentLineItem[]> {
    const rows = await this.db
      .select({
        id: stockAdjustmentLineItems.id,
        organizationId: stockAdjustmentLineItems.organizationId,
        businessUnitId: stockAdjustmentLineItems.businessUnitId,
        stockAdjustmentLineId: stockAdjustmentLineItems.stockAdjustmentLineId,
        serialNumber: stockAdjustmentLineItems.serialNumber,
        createdAt: stockAdjustmentLineItems.createdAt,
        updatedAt: stockAdjustmentLineItems.updatedAt,
      })
      .from(stockAdjustmentLineItems)
      .innerJoin(stockAdjustmentLines, eq(stockAdjustmentLineItems.stockAdjustmentLineId, stockAdjustmentLines.id))
      .where(eq(stockAdjustmentLines.stockAdjustmentId, adjustmentId));
    return rows as StockAdjustmentLineItem[];
  }

  async findById(id: string): Promise<StockAdjustmentLineItem | undefined> {
    const rows = await this.db.select().from(stockAdjustmentLineItems).where(eq(stockAdjustmentLineItems.id, id));
    return rows[0] as StockAdjustmentLineItem | undefined;
  }

  async findForTable(
    lineId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
  ): Promise<{ result: StockAdjustmentLineItem[]; count: number }> {
    const baseWhere = eq(stockAdjustmentLineItems.stockAdjustmentLineId, lineId);
    const combinedWhere = options.where ? and(baseWhere, options.where) : baseWhere;
    return this.findAllAndCount<StockAdjustmentLineItem>({
      where: combinedWhere,
      orderBy: options.orderBy?.length ? options.orderBy : [asc(stockAdjustmentLineItems.createdAt)],
      limit: options.limit,
      offset: options.offset,
    });
  }

  async findStatsByLineIds(lineIds: string[]): Promise<Map<string, { count: number }>> {
    if (lineIds.length === 0) return new Map();
    const rows = await this.db
      .select({
        lineId: stockAdjustmentLineItems.stockAdjustmentLineId,
        count: sql<number>`count(*)`,
      })
      .from(stockAdjustmentLineItems)
      .where(inArray(stockAdjustmentLineItems.stockAdjustmentLineId, lineIds))
      .groupBy(stockAdjustmentLineItems.stockAdjustmentLineId);
    return new Map(rows.map((r) => [r.lineId, { count: Number(r.count) }]));
  }

  async findBySerialOnLine(lineId: string, serialNumber: string): Promise<StockAdjustmentLineItem | undefined> {
    const rows = await this.db
      .select()
      .from(stockAdjustmentLineItems)
      .where(
        and(
          eq(stockAdjustmentLineItems.stockAdjustmentLineId, lineId),
          eq(stockAdjustmentLineItems.serialNumber, serialNumber),
        ),
      )
      .limit(1);
    return rows[0] as StockAdjustmentLineItem | undefined;
  }

  // Returns the number of serial items already registered on a line
  async countByLineId(lineId: string): Promise<number> {
    const [result] = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(stockAdjustmentLineItems)
      .where(eq(stockAdjustmentLineItems.stockAdjustmentLineId, lineId));
    return Number(result?.count ?? 0);
  }
}
