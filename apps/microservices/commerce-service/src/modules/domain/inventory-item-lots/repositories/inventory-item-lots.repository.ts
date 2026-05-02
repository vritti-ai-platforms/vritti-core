import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { and, eq } from '@vritti/api-sdk/drizzle-orm';
import { type InventoryItemLot, inventoryItemLots } from '@/db/schema';

@Injectable()
export class InventoryItemLotsRepository extends PrimaryBaseRepository<typeof inventoryItemLots> {
  constructor(database: PrimaryDatabaseService) {
    super(database, inventoryItemLots);
  }

  // Checks if a lot already exists for this item
  async findByItemAndNumber(
    inventoryItemId: string,
    lotNumber: string,
  ): Promise<InventoryItemLot | undefined> {
    const rows = await this.db
      .select()
      .from(inventoryItemLots)
      .where(and(eq(inventoryItemLots.inventoryItemId, inventoryItemId), eq(inventoryItemLots.lotNumber, lotNumber)))
      .limit(1);
    return rows[0] as InventoryItemLot | undefined;
  }

  async createLot(data: typeof inventoryItemLots.$inferInsert): Promise<InventoryItemLot> {
    const results = await this.db.insert(inventoryItemLots).values(data).returning();
    return results[0] as InventoryItemLot;
  }
}
