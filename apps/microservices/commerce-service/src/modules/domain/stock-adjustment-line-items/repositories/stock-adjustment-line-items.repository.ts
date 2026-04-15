import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { and, desc, eq, inArray, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { stockAdjustmentLineItems, stockAdjustmentLines, type StockAdjustmentLineItem } from '@/db/schema';

@Injectable()
export class StockAdjustmentLineItemsRepository extends PrimaryBaseRepository<typeof stockAdjustmentLineItems> {
  constructor(database: PrimaryDatabaseService) {
    super(database, stockAdjustmentLineItems);
  }

  async findByLineId(lineId: string): Promise<StockAdjustmentLineItem[]> {
    const rows = await this.db
      .select()
      .from(stockAdjustmentLineItems)
      .where(eq(stockAdjustmentLineItems.stockAdjustmentLineId, lineId));

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
      orderBy: options.orderBy?.length ? options.orderBy : [desc(stockAdjustmentLineItems.createdAt)],
      limit: options.limit,
      offset: options.offset,
    });
  }

  async findStatsByLineIds(
    lineIds: string[],
  ): Promise<Map<string, { lineItemsCount: number; lineItemsQuantitySum: number }>> {
    if (lineIds.length === 0) return new Map();

    const rows = await this.db
      .select({
        lineId: stockAdjustmentLineItems.stockAdjustmentLineId,
        lineItemsCount: sql<number>`count(*)`,
        lineItemsQuantitySum: sql<string>`COALESCE(SUM(${stockAdjustmentLineItems.quantity}), 0)`,
      })
      .from(stockAdjustmentLineItems)
      .where(inArray(stockAdjustmentLineItems.stockAdjustmentLineId, lineIds))
      .groupBy(stockAdjustmentLineItems.stockAdjustmentLineId);

    return new Map(
      rows.map((row) => [
        row.lineId,
        {
          lineItemsCount: Number(row.lineItemsCount ?? 0),
          lineItemsQuantitySum: Number(row.lineItemsQuantitySum ?? 0),
        },
      ]),
    );
  }

  async findValidationRowsByAdjustmentId(
    adjustmentId: string,
  ): Promise<
    {
      lineId: string;
      lineQuantity: number;
      lineItemsCount: number;
      lineItemsQuantitySum: number;
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

    return rows.map((row) => ({
      lineId: row.lineId,
      lineQuantity: Number(row.lineQuantity),
      lineItemsCount: Number(row.lineItemsCount ?? 0),
      lineItemsQuantitySum: Number(row.lineItemsQuantitySum ?? 0),
    }));
  }
}
