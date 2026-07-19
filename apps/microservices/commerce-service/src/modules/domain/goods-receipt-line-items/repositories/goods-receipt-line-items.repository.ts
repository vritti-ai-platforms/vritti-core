import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, eq, inArray, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type GoodsReceiptLineItem,
  goodsReceiptItems,
  goodsReceiptLineItems,
  goodsReceiptLines,
  inventoryItemSerials,
} from '@/db/schema';

@Injectable()
export class GoodsReceiptLineItemsDomainRepository extends PrimaryBaseRepository<typeof goodsReceiptLineItems> {
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
        siteId: goodsReceiptLineItems.siteId,
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

  // Scopes the duplicate-serial check across the entire goods receipt — catches the case where
  // the same serial is scanned onto two different lines of the same draft GR (which the line-level
  // unique constraint wouldn't catch). Mirrors SA's findBySerialOnAdjustment.
  async findBySerialOnReceipt(
    goodsReceiptId: string,
    serialNumber: string,
  ): Promise<{ id: string; goodsReceiptLineId: string } | undefined> {
    const rows = await this.db
      .select({
        id: goodsReceiptLineItems.id,
        goodsReceiptLineId: goodsReceiptLineItems.goodsReceiptLineId,
      })
      .from(goodsReceiptLineItems)
      .innerJoin(goodsReceiptLines, eq(goodsReceiptLineItems.goodsReceiptLineId, goodsReceiptLines.id))
      .innerJoin(goodsReceiptItems, eq(goodsReceiptLines.goodsReceiptItemId, goodsReceiptItems.id))
      .where(
        and(eq(goodsReceiptItems.goodsReceiptId, goodsReceiptId), eq(goodsReceiptLineItems.serialNumber, serialNumber)),
      )
      .limit(1);
    return rows[0];
  }

  // True if the serial is already registered in inventory for the given item. Goods receipt
  // REGISTERS new serials, so a hit here is a collision with existing inventory_item_serials.
  async existsSerialInInventory(inventoryItemId: string, serialNumber: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: inventoryItemSerials.id })
      .from(inventoryItemSerials)
      .where(
        and(
          eq(inventoryItemSerials.inventoryItemId, inventoryItemId),
          eq(inventoryItemSerials.serialNumber, serialNumber),
        ),
      )
      .limit(1);
    return rows.length > 0;
  }
}
