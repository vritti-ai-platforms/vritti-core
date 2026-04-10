import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { and, eq, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type InventoryLedgerEntry,
  type NewInventoryLedgerEntry,
  type StockTransfer,
  inventoryItems,
  inventoryLedger,
  inventoryLevels,
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

  // Deducts from inventory level for a specific BU
  async deductFromInventoryLevelForBu(inventoryItemId: string, buId: string, quantity: number): Promise<void> {
    await this.db
      .update(inventoryLevels)
      .set({
        stockedQuantity: sql`${inventoryLevels.stockedQuantity} - ${String(quantity)}`,
      })
      .where(
        and(eq(inventoryLevels.inventoryItemId, inventoryItemId), eq(inventoryLevels.businessUnitId, buId)),
      );
  }

  // Adds to inventory level for a specific BU (upserts if not exists)
  async addToInventoryLevelForBu(inventoryItemId: string, buId: string, quantity: number): Promise<void> {
    const existing = await this.db
      .select()
      .from(inventoryLevels)
      .where(
        and(eq(inventoryLevels.inventoryItemId, inventoryItemId), eq(inventoryLevels.businessUnitId, buId)),
      )
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
        businessUnitId: buId,
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
