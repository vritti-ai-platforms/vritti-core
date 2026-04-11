import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { eq } from '@vritti/api-sdk/drizzle-orm';
import {
  type StockAdjustment,
  inventoryItems,
  stockAdjustments,
  storageLocations,
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

  // Returns a single stock adjustment by ID
  async findById(id: string): Promise<StockAdjustment | undefined> {
    const rows = await this.db
      .select()
      .from(stockAdjustments)
      .where(eq(stockAdjustments.id, id));
    return rows[0] as StockAdjustment | undefined;
  }

  // Returns the item code and location code for batch number generation
  async findItemAndLocationCodes(itemId: string, locationId: string): Promise<{ itemCode: string; locationCode: string }> {
    const [itemRow] = await this.db
      .select({ code: inventoryItems.code })
      .from(inventoryItems)
      .where(eq(inventoryItems.id, itemId));

    const [locationRow] = await this.db
      .select({ code: storageLocations.code })
      .from(storageLocations)
      .where(eq(storageLocations.id, locationId));

    return { itemCode: itemRow?.code ?? '', locationCode: locationRow?.code ?? '' };
  }

  // Deletes a stock adjustment by ID
  async deleteById(id: string): Promise<void> {
    await this.db.delete(stockAdjustments).where(eq(stockAdjustments.id, id));
  }
}
