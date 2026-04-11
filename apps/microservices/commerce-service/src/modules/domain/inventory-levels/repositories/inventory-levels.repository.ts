import { Injectable, Logger } from '@nestjs/common';
import { PrimaryDatabaseService } from '@vritti/api-sdk';
import { desc, eq, and, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type InventoryLedgerEntry,
  type InventoryLevel,
  type NewInventoryLedgerEntry,
  inventoryLedger,
  inventoryLevels,
  storageLocations,
} from '@/db/schema';

@Injectable()
export class InventoryLevelsRepository {
  private readonly logger = new Logger(InventoryLevelsRepository.name);

  constructor(private readonly database: PrimaryDatabaseService) {}

  private get db() {
    return this.database.drizzleClient;
  }

  // Finds an existing level or creates one for the given item + location
  async findOrCreateLevel(itemId: string, locationId: string): Promise<InventoryLevel> {
    const existing = await this.db
      .select()
      .from(inventoryLevels)
      .where(and(eq(inventoryLevels.inventoryItemId, itemId), eq(inventoryLevels.locationId, locationId)));

    if (existing.length > 0) {
      return existing[0] as InventoryLevel;
    }

    const inserted = await this.db
      .insert(inventoryLevels)
      .values({ inventoryItemId: itemId, locationId })
      .returning();

    return inserted[0] as InventoryLevel;
  }

  // Atomically increments/decrements the stocked quantity by delta
  async updateStockedQuantity(levelId: string, delta: string): Promise<InventoryLevel> {
    const results = await this.db
      .update(inventoryLevels)
      .set({
        stockedQuantity: sql`${inventoryLevels.stockedQuantity} + ${delta}`,
      })
      .where(eq(inventoryLevels.id, levelId))
      .returning();

    return results[0] as InventoryLevel;
  }

  // Atomically increments/decrements the reserved quantity by delta
  async updateReservedQuantity(levelId: string, delta: string): Promise<InventoryLevel> {
    const results = await this.db
      .update(inventoryLevels)
      .set({
        reservedQuantity: sql`${inventoryLevels.reservedQuantity} + ${delta}`,
      })
      .where(eq(inventoryLevels.id, levelId))
      .returning();

    return results[0] as InventoryLevel;
  }

  // Creates a new ledger entry for the audit trail
  async createLedgerEntry(data: NewInventoryLedgerEntry): Promise<InventoryLedgerEntry> {
    const results = await this.db.insert(inventoryLedger).values(data).returning();
    return results[0] as InventoryLedgerEntry;
  }

  // Returns all stock levels for an item with location names via LEFT JOIN
  async findLevelsByItemId(itemId: string) {
    const rows = await this.db
      .select({
        id: inventoryLevels.id,
        organizationId: inventoryLevels.organizationId,
        inventoryItemId: inventoryLevels.inventoryItemId,
        locationId: inventoryLevels.locationId,
        stockedQuantity: inventoryLevels.stockedQuantity,
        reservedQuantity: inventoryLevels.reservedQuantity,
        reorderLevel: inventoryLevels.reorderLevel,
        createdAt: inventoryLevels.createdAt,
        updatedAt: inventoryLevels.updatedAt,
        locationName: storageLocations.name,
      })
      .from(inventoryLevels)
      .leftJoin(storageLocations, eq(inventoryLevels.locationId, storageLocations.id))
      .where(eq(inventoryLevels.inventoryItemId, itemId));

    return rows;
  }

  // Returns recent ledger entries for an item, newest first
  async findLedgerByItemId(itemId: string, limit = 50): Promise<InventoryLedgerEntry[]> {
    return this.db
      .select()
      .from(inventoryLedger)
      .where(eq(inventoryLedger.inventoryItemId, itemId))
      .orderBy(desc(inventoryLedger.createdAt))
      .limit(limit);
  }
}
