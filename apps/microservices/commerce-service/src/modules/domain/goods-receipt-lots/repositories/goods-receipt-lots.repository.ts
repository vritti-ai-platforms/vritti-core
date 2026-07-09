import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, eq, sql } from '@vritti/api-sdk/drizzle-orm';
import { type GoodsReceiptLot, goodsReceiptLineItems, goodsReceiptLines, goodsReceiptLots } from '@/db/schema';

export type GoodsReceiptLotWithStats = GoodsReceiptLot & {
  linesCount: number;
  totalQuantity: number;
};

@Injectable()
export class GoodsReceiptLotsRepository extends PrimaryBaseRepository<typeof goodsReceiptLots> {
  constructor(database: PrimaryDatabaseService) {
    super(database, goodsReceiptLots);
  }

  async findByItemId(itemId: string): Promise<GoodsReceiptLotWithStats[]> {
    const rows = await this.db
      .select({
        id: goodsReceiptLots.id,
        organizationId: goodsReceiptLots.organizationId,
        businessUnitId: goodsReceiptLots.businessUnitId,
        goodsReceiptItemId: goodsReceiptLots.goodsReceiptItemId,
        lotNumber: goodsReceiptLots.lotNumber,
        manufacturingDate: goodsReceiptLots.manufacturingDate,
        expiryDate: goodsReceiptLots.expiryDate,
        resolvedLotId: goodsReceiptLots.resolvedLotId,
        mrp: goodsReceiptLots.mrp,
        metadata: goodsReceiptLots.metadata,
        createdAt: goodsReceiptLots.createdAt,
        updatedAt: goodsReceiptLots.updatedAt,
        linesCount: sql<number>`COALESCE(COUNT(DISTINCT ${goodsReceiptLines.id}), 0)`,
        totalQuantity: sql<string>`COALESCE(SUM(${goodsReceiptLines.quantity}), 0)`,
      })
      .from(goodsReceiptLots)
      .leftJoin(goodsReceiptLines, eq(goodsReceiptLots.id, goodsReceiptLines.goodsReceiptLotId))
      .where(eq(goodsReceiptLots.goodsReceiptItemId, itemId))
      .groupBy(goodsReceiptLots.id)
      .orderBy(asc(goodsReceiptLots.createdAt));

    return rows.map((row) => ({
      ...row,
      linesCount: Number(row.linesCount),
      totalQuantity: Number(row.totalQuantity),
    })) as GoodsReceiptLotWithStats[];
  }

  async findById(lotId: string): Promise<GoodsReceiptLot | undefined> {
    const rows = await this.db.select().from(goodsReceiptLots).where(eq(goodsReceiptLots.id, lotId)).limit(1);
    return rows[0] as GoodsReceiptLot | undefined;
  }

  async findByItemIdAndNumber(itemId: string, lotNumber: string): Promise<GoodsReceiptLot | undefined> {
    const rows = await this.db
      .select()
      .from(goodsReceiptLots)
      .where(and(eq(goodsReceiptLots.goodsReceiptItemId, itemId), eq(goodsReceiptLots.lotNumber, lotNumber)))
      .limit(1);
    return rows[0] as GoodsReceiptLot | undefined;
  }

  async createLot(data: typeof goodsReceiptLots.$inferInsert): Promise<GoodsReceiptLot> {
    const results = await this.db.insert(goodsReceiptLots).values(data).returning();
    return results[0] as GoodsReceiptLot;
  }

  async setResolvedLotId(lotId: string, resolvedLotId: string): Promise<void> {
    await this.db.update(goodsReceiptLots).set({ resolvedLotId }).where(eq(goodsReceiptLots.id, lotId));
  }

  // Counts how many line_items reference any line under this lot — used to validate deletion safety
  async countLineItemsForLot(lotId: string): Promise<number> {
    const rows = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(goodsReceiptLineItems)
      .innerJoin(goodsReceiptLines, eq(goodsReceiptLineItems.goodsReceiptLineId, goodsReceiptLines.id))
      .where(eq(goodsReceiptLines.goodsReceiptLotId, lotId));
    return Number(rows[0]?.count ?? 0);
  }
}
