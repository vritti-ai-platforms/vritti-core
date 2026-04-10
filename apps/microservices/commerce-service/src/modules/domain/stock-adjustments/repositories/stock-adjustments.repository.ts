import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { eq, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type InventoryLedgerEntry,
  type NewInventoryLedgerEntry,
  type StockAdjustment,
  inventoryItems,
  inventoryLedger,
  inventoryLevels,
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

  // Adjusts the inventory level stocked quantity (handles both positive and negative)
  async adjustInventoryLevel(inventoryItemId: string, quantity: number): Promise<void> {
    const existing = await this.db
      .select()
      .from(inventoryLevels)
      .where(eq(inventoryLevels.inventoryItemId, inventoryItemId))
      .then((rows) => rows[0]);

    if (existing) {
      await this.db
        .update(inventoryLevels)
        .set({
          stockedQuantity: sql`${inventoryLevels.stockedQuantity} + ${String(quantity)}`,
        })
        .where(eq(inventoryLevels.id, existing.id));
    } else {
      await this.db.insert(inventoryLevels).values({
        inventoryItemId,
        stockedQuantity: String(quantity),
      });
    }
  }

  // Appends a ledger entry
  async createLedgerEntry(data: NewInventoryLedgerEntry): Promise<InventoryLedgerEntry> {
    const results = await this.db.insert(inventoryLedger).values(data).returning();
    return results[0] as InventoryLedgerEntry;
  }
}
