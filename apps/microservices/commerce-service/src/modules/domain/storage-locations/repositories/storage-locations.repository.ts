import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { eq, inArray, sql } from '@vritti/api-sdk/drizzle-orm';
import { type StorageLocation, inventoryItems, inventoryLevels, storageLocations, uom } from '@/db/schema';

@Injectable()
export class StorageLocationsRepository extends PrimaryBaseRepository<typeof storageLocations> {
  constructor(database: PrimaryDatabaseService) {
    super(database, storageLocations);
  }

  // Returns all storage locations ordered by name
  async findAll(): Promise<StorageLocation[]> {
    return this.db.select().from(storageLocations).orderBy(storageLocations.name);
  }

  // Returns a set of location IDs that are referenced by inventory levels
  async findReferencedIds(ids: string[]): Promise<Set<string>> {
    if (ids.length === 0) return new Set();
    const rows = await this.db
      .select({ id: inventoryLevels.locationId })
      .from(inventoryLevels)
      .where(inArray(inventoryLevels.locationId, ids));
    const referenced = new Set<string>();
    for (const row of rows) {
      if (row.id) referenced.add(row.id);
    }
    return referenced;
  }

  // Counts references to this location across inventory levels
  async countReferences(id: string): Promise<{ inventoryLevels: number }> {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(inventoryLevels)
      .where(eq(inventoryLevels.locationId, id));
    return { inventoryLevels: Number(result?.count ?? 0) };
  }

  // Returns levels at a location with item name, code, and uom symbol via LEFT JOINs
  async findLevelsByLocationId(locationId: string) {
    return this.db
      .select({
        id: inventoryLevels.id,
        inventoryItemId: inventoryLevels.inventoryItemId,
        itemName: inventoryItems.name,
        itemCode: inventoryItems.code,
        uomSymbol: uom.symbol,
        stockedQuantity: inventoryLevels.stockedQuantity,
        reservedQuantity: inventoryLevels.reservedQuantity,
        reorderLevel: inventoryLevels.reorderLevel,
      })
      .from(inventoryLevels)
      .leftJoin(inventoryItems, eq(inventoryLevels.inventoryItemId, inventoryItems.id))
      .leftJoin(uom, eq(inventoryItems.uomId, uom.id))
      .where(eq(inventoryLevels.locationId, locationId));
  }
}
