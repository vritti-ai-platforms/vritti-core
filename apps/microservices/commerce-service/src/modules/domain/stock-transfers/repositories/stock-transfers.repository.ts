import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { eq } from '@vritti/api-sdk/drizzle-orm';
import {
  type StockTransfer,
  inventoryItems,
  stockTransfers,
} from '@/db/schema';

@Injectable()
export class StockTransfersRepository extends PrimaryBaseRepository<typeof stockTransfers> {
  constructor(database: PrimaryDatabaseService) {
    super(database, stockTransfers);
  }

  // Returns all stock transfers with inventory item names
  async findAllWithItemNames(
    params: { where?: any; orderBy?: any; limit?: number; offset?: number },
  ): Promise<{ result: (StockTransfer & { inventoryItemName: string | null })[]; count: number }> {
    const baseResult = await this.findAllAndCount(params);
    const enriched: (StockTransfer & { inventoryItemName: string | null })[] = [];

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
