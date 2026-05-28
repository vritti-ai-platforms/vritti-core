import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { and, asc, eq, inArray, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { type GoodsReceiptLineItem, goodsReceiptItems, goodsReceiptLineItems, goodsReceiptLines } from '@/db/schema';

@Injectable()
export class GoodsReceiptLineItemsRepository extends PrimaryBaseRepository<typeof goodsReceiptLineItems> {
  constructor(database: PrimaryDatabaseService) {
    super(database, goodsReceiptLineItems);
  }

  async findByLineId(lineId: string): Promise<GoodsReceiptLineItem[]> {
    const rows = await this.db
      .select()
      .from(goodsReceiptLineItems)
      .where(eq(goodsReceiptLineItems.goodsReceiptLineId, lineId))
      .orderBy(asc(goodsReceiptLineItems.createdAt));
    return rows as GoodsReceiptLineItem[];
  }

  async findByReceiptId(goodsReceiptId: string): Promise<GoodsReceiptLineItem[]> {
    const rows = await this.db
      .select({
        id: goodsReceiptLineItems.id,
        organizationId: goodsReceiptLineItems.organizationId,
        businessUnitId: goodsReceiptLineItems.businessUnitId,
        goodsReceiptLineId: goodsReceiptLineItems.goodsReceiptLineId,
        serialNumber: goodsReceiptLineItems.serialNumber,
        metadata: goodsReceiptLineItems.metadata,
        createdAt: goodsReceiptLineItems.createdAt,
        updatedAt: goodsReceiptLineItems.updatedAt,
      })
      .from(goodsReceiptLineItems)
      .innerJoin(goodsReceiptLines, eq(goodsReceiptLineItems.goodsReceiptLineId, goodsReceiptLines.id))
      .innerJoin(goodsReceiptItems, eq(goodsReceiptLines.goodsReceiptItemId, goodsReceiptItems.id))
      .where(eq(goodsReceiptItems.goodsReceiptId, goodsReceiptId));
    return rows as GoodsReceiptLineItem[];
  }

  async findById(id: string): Promise<GoodsReceiptLineItem | undefined> {
    const rows = await this.db.select().from(goodsReceiptLineItems).where(eq(goodsReceiptLineItems.id, id));
    return rows[0] as GoodsReceiptLineItem | undefined;
  }

  async findForTable(
    lineId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
  ): Promise<{ result: GoodsReceiptLineItem[]; count: number }> {
    const baseWhere = eq(goodsReceiptLineItems.goodsReceiptLineId, lineId);
    const combinedWhere = options.where ? and(baseWhere, options.where) : baseWhere;
    return this.findAllAndCount<GoodsReceiptLineItem>({
      where: combinedWhere,
      orderBy: options.orderBy?.length ? options.orderBy : [asc(goodsReceiptLineItems.createdAt)],
      limit: options.limit,
      offset: options.offset,
    });
  }

  async findStatsByLineIds(lineIds: string[]): Promise<Map<string, { count: number }>> {
    if (lineIds.length === 0) return new Map();
    const rows = await this.db
      .select({
        lineId: goodsReceiptLineItems.goodsReceiptLineId,
        count: sql<number>`count(*)`,
      })
      .from(goodsReceiptLineItems)
      .where(inArray(goodsReceiptLineItems.goodsReceiptLineId, lineIds))
      .groupBy(goodsReceiptLineItems.goodsReceiptLineId);
    return new Map(rows.map((r) => [r.lineId, { count: Number(r.count) }]));
  }

  async countByLineId(lineId: string): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(goodsReceiptLineItems)
      .where(eq(goodsReceiptLineItems.goodsReceiptLineId, lineId));
    return Number(row?.count ?? 0);
  }

  async findBySerialOnLine(lineId: string, serialNumber: string): Promise<GoodsReceiptLineItem | undefined> {
    const rows = await this.db
      .select()
      .from(goodsReceiptLineItems)
      .where(
        and(eq(goodsReceiptLineItems.goodsReceiptLineId, lineId), eq(goodsReceiptLineItems.serialNumber, serialNumber)),
      )
      .limit(1);
    return rows[0] as GoodsReceiptLineItem | undefined;
  }
}
