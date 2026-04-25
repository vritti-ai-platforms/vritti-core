import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { and, desc, eq, inArray, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  goodsReceiptBatchItems,
  type GoodsReceiptBatch,
  goodsReceiptBatches,
  goodsReceiptItems,
  inventoryItems,
  storageLocations,
} from '@/db/schema';

@Injectable()
export class GoodsReceiptBatchesRepository extends PrimaryBaseRepository<typeof goodsReceiptBatches> {
  constructor(database: PrimaryDatabaseService) {
    super(database, goodsReceiptBatches);
  }

  async findByLineId(
    lineId: string,
  ): Promise<(GoodsReceiptBatch & { inventoryItemName: string | null; locationName: string | null })[]> {
    const rows = await this.db
      .select({
        id: goodsReceiptBatches.id,
        organizationId: goodsReceiptBatches.organizationId,
        businessUnitId: goodsReceiptBatches.businessUnitId,
        goodsReceiptLineId: goodsReceiptBatches.goodsReceiptLineId,
        inventoryItemId: goodsReceiptBatches.inventoryItemId,
        locationId: goodsReceiptBatches.locationId,
        acceptedQuantity: goodsReceiptBatches.acceptedQuantity,
        rejectedQuantity: goodsReceiptBatches.rejectedQuantity,
        rejectionReason: goodsReceiptBatches.rejectionReason,
        isBalanced: goodsReceiptBatches.isBalanced,
        manufacturingDate: goodsReceiptBatches.manufacturingDate,
        expiryDate: goodsReceiptBatches.expiryDate,
        createdAt: goodsReceiptBatches.createdAt,
        updatedAt: goodsReceiptBatches.updatedAt,
        inventoryItemName: inventoryItems.name,
        locationName: storageLocations.name,
      })
      .from(goodsReceiptBatches)
      .leftJoin(inventoryItems, eq(goodsReceiptBatches.inventoryItemId, inventoryItems.id))
      .leftJoin(storageLocations, eq(goodsReceiptBatches.locationId, storageLocations.id))
      .where(eq(goodsReceiptBatches.goodsReceiptLineId, lineId))
      .orderBy(desc(goodsReceiptBatches.createdAt));
    return rows as (GoodsReceiptBatch & { inventoryItemName: string | null; locationName: string | null })[];
  }

  async findBatchById(batchId: string): Promise<GoodsReceiptBatch | null> {
    const [row] = await this.db.select().from(goodsReceiptBatches).where(eq(goodsReceiptBatches.id, batchId));
    return row ?? null;
  }

  async findByLineIdAndBatchId(lineId: string, batchId: string): Promise<GoodsReceiptBatch | null> {
    const [row] = await this.db
      .select()
      .from(goodsReceiptBatches)
      .where(and(eq(goodsReceiptBatches.goodsReceiptLineId, lineId), eq(goodsReceiptBatches.id, batchId)));
    return row ?? null;
  }

  async findByReceiptIdForPublish(goodsReceiptId: string): Promise<GoodsReceiptBatch[]> {
    const rows = await this.db
      .select({
        id: goodsReceiptBatches.id,
        organizationId: goodsReceiptBatches.organizationId,
        businessUnitId: goodsReceiptBatches.businessUnitId,
        goodsReceiptLineId: goodsReceiptBatches.goodsReceiptLineId,
        inventoryItemId: goodsReceiptBatches.inventoryItemId,
        locationId: goodsReceiptBatches.locationId,
        acceptedQuantity: goodsReceiptBatches.acceptedQuantity,
        rejectedQuantity: goodsReceiptBatches.rejectedQuantity,
        rejectionReason: goodsReceiptBatches.rejectionReason,
        isBalanced: goodsReceiptBatches.isBalanced,
        manufacturingDate: goodsReceiptBatches.manufacturingDate,
        expiryDate: goodsReceiptBatches.expiryDate,
        createdAt: goodsReceiptBatches.createdAt,
        updatedAt: goodsReceiptBatches.updatedAt,
      })
      .from(goodsReceiptBatches)
      .innerJoin(goodsReceiptItems, eq(goodsReceiptBatches.goodsReceiptLineId, goodsReceiptItems.id))
      .where(eq(goodsReceiptItems.goodsReceiptId, goodsReceiptId));

    return rows as GoodsReceiptBatch[];
  }

  async findStatsByBatchIds(
    batchIds: string[],
  ): Promise<Map<string, { batchItemsCount: number; batchItemsQuantitySum: string }>> {
    if (batchIds.length === 0) return new Map();
    const rows = await this.db
      .select({
        batchId: goodsReceiptBatchItems.goodsReceiptBatchId,
        batchItemsCount: sql<number>`COUNT(${goodsReceiptBatchItems.id})`,
        batchItemsQuantitySum: sql<string>`COALESCE(SUM(${goodsReceiptBatchItems.quantity}), 0)`,
      })
      .from(goodsReceiptBatchItems)
      .where(inArray(goodsReceiptBatchItems.goodsReceiptBatchId, batchIds))
      .groupBy(goodsReceiptBatchItems.goodsReceiptBatchId);

    return new Map(rows.map((row) => [row.batchId, row]));
  }

  async refreshIsBalanced(batchId: string): Promise<void> {
    await this.db
      .update(goodsReceiptBatches)
      .set({
        isBalanced: sql`COALESCE((
          SELECT SUM(i.quantity)
          FROM vritti_core.goods_receipt_batch_items i
          WHERE i.goods_receipt_batch_id = ${goodsReceiptBatches.id}
        ), 0) = ${goodsReceiptBatches.acceptedQuantity}`,
      })
      .where(eq(goodsReceiptBatches.id, batchId));
  }
}
