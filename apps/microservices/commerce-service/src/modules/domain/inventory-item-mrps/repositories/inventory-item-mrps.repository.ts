import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { eq } from '@vritti/api-sdk/drizzle-orm';
import { type InventoryItemMrp, inventoryItemMrps } from '@/db/schema';

@Injectable()
export class InventoryItemMrpsRepository extends PrimaryBaseRepository<typeof inventoryItemMrps> {
  constructor(database: PrimaryDatabaseService) {
    super(database, inventoryItemMrps);
  }

  // Inserts or updates the suggested MRP for an (item, currency) pair; latest lot wins.
  async upsertForCurrency(
    inventoryItemId: string,
    currencyCode: string,
    amount: bigint,
    sourceLotId: string | null,
  ): Promise<InventoryItemMrp> {
    const [row] = (await this.db
      .insert(inventoryItemMrps)
      .values({ inventoryItemId, currencyCode, amount, sourceLotId, sourcedAt: new Date() })
      .onConflictDoUpdate({
        target: [inventoryItemMrps.inventoryItemId, inventoryItemMrps.currencyCode],
        set: { amount, sourceLotId, sourcedAt: new Date() },
      })
      .returning()) as InventoryItemMrp[];
    return row;
  }

  // Returns all suggested MRPs for an inventory item (one row per currency)
  async findByItem(inventoryItemId: string): Promise<InventoryItemMrp[]> {
    return this.db.select().from(inventoryItemMrps).where(eq(inventoryItemMrps.inventoryItemId, inventoryItemId));
  }
}
