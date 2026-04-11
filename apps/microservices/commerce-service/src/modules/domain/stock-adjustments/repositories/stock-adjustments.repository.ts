import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { eq } from '@vritti/api-sdk/drizzle-orm';
import {
  type StockAdjustment,
  inventoryItems,
  stockAdjustments,
} from '@/db/schema';

@Injectable()
export class StockAdjustmentsRepository extends PrimaryBaseRepository<typeof stockAdjustments> {
  constructor(database: PrimaryDatabaseService) {
    super(database, stockAdjustments);
  }

  // Returns all stock adjustments with inventory item names
  async findAllWithItemNames(
    params: { where?: any; orderBy?: any; limit?: number; offset?: number },
  ): Promise<{ result: (StockAdjustment & { inventoryItemName: string | null })[]; count: number }> {
    const baseResult = await this.findAllAndCount(params);
    const enriched: (StockAdjustment & { inventoryItemName: string | null })[] = [];

    for (const row of baseResult.result) {
      const itemRow = await this.db
        .select({ name: inventoryItems.name })
        .from(inventoryItems)
        .where(eq(inventoryItems.id, row.inventoryItemId))
        .then((rows) => rows[0]);
      enriched.push({ ...row, inventoryItemName: itemRow?.name ?? null });
    }

    return { result: enriched, count: baseResult.count };
  }
}
