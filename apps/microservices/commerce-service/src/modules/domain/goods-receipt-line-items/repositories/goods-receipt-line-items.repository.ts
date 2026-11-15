import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, eq, type SQL } from '@vritti/api-sdk/drizzle-orm';
import { type GoodsReceiptLineItem, goodsReceiptLineItems, inventoryItemSerials } from '@/db/schema';

export type SerialConflict = {
  isOnLine: boolean;
  isInInventory: boolean;
};

@Injectable()
export class GoodsReceiptLineItemsDomainRepository extends PrimaryBaseRepository<typeof goodsReceiptLineItems> {
  constructor(database: PrimaryDatabaseService) {
    super(database, goodsReceiptLineItems);
  }

  // Returns the serials registered on a line, oldest first
  async findByLineId(lineId: string): Promise<GoodsReceiptLineItem[]> {
    return this.findAllWithSelect({
      where: eq(goodsReceiptLineItems.goodsReceiptLineId, lineId),
      orderBy: [asc(goodsReceiptLineItems.createdAt)],
    });
  }

  // Returns one page of the serials registered on a line
  async findForTable(
    lineId: string,
    options: { where?: SQL; orderBy: SQL[]; limit: number; offset: number },
  ): Promise<{ result: GoodsReceiptLineItem[]; count: number }> {
    return this.findAllAndCount({
      ...options,
      where: and(eq(goodsReceiptLineItems.goodsReceiptLineId, lineId), options.where),
    });
  }

  // Loads a serial of the given line
  findOnLine(lineId: string, lineItemId: string): Promise<GoodsReceiptLineItem | undefined> {
    return this.findOne({ id: lineItemId, goodsReceiptLineId: lineId });
  }

  // Counts the serials registered on a line
  countOnLine(lineId: string): Promise<number> {
    return this.count(eq(goodsReceiptLineItems.goodsReceiptLineId, lineId));
  }

  // Reports whether a serial is already on the line and whether it is already registered in inventory
  async findSerialConflict(lineId: string, inventoryItemId: string, serialNumber: string): Promise<SerialConflict> {
    const isOnLine = await this.exists(
      and(
        eq(goodsReceiptLineItems.goodsReceiptLineId, lineId),
        eq(goodsReceiptLineItems.serialNumber, serialNumber),
      ) as SQL,
    );
    const [inInventory] = await this.db
      .select({ id: inventoryItemSerials.id })
      .from(inventoryItemSerials)
      .where(
        and(
          eq(inventoryItemSerials.inventoryItemId, inventoryItemId),
          eq(inventoryItemSerials.serialNumber, serialNumber),
        ),
      )
      .limit(1);
    return { isOnLine, isInInventory: inInventory !== undefined };
  }
}
