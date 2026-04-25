import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { and, desc, eq } from '@vritti/api-sdk/drizzle-orm';
import { type GoodsReceiptBatchItem, goodsReceiptBatchItems } from '@/db/schema';

@Injectable()
export class GoodsReceiptBatchItemsRepository extends PrimaryBaseRepository<typeof goodsReceiptBatchItems> {
  constructor(database: PrimaryDatabaseService) {
    super(database, goodsReceiptBatchItems);
  }

  async findByBatchId(batchId: string): Promise<GoodsReceiptBatchItem[]> {
    return this.db
      .select()
      .from(goodsReceiptBatchItems)
      .where(eq(goodsReceiptBatchItems.goodsReceiptBatchId, batchId))
      .orderBy(desc(goodsReceiptBatchItems.createdAt)) as Promise<GoodsReceiptBatchItem[]>;
  }

  async findBatchItemById(itemId: string): Promise<GoodsReceiptBatchItem | null> {
    const [row] = await this.db.select().from(goodsReceiptBatchItems).where(eq(goodsReceiptBatchItems.id, itemId));
    return row ?? null;
  }

  async findByBatchIdAndItemId(batchId: string, itemId: string): Promise<GoodsReceiptBatchItem | null> {
    const [row] = await this.db
      .select()
      .from(goodsReceiptBatchItems)
      .where(and(eq(goodsReceiptBatchItems.goodsReceiptBatchId, batchId), eq(goodsReceiptBatchItems.id, itemId)));
    return row ?? null;
  }
}
