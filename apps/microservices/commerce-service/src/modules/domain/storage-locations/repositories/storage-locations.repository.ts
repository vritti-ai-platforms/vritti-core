import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { asc, eq, inArray, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  inventoryItemBatches,
  type StorageLocation,
  storageLocations,
} from '@/db/schema';

@Injectable()
export class StorageLocationsRepository extends PrimaryBaseRepository<typeof storageLocations> {
  constructor(database: PrimaryDatabaseService) {
    super(database, storageLocations);
  }

  // Returns all storage locations ordered by sort order and name
  async findAll(): Promise<StorageLocation[]> {
    return this.db.select().from(storageLocations).orderBy(asc(storageLocations.sortOrder), asc(storageLocations.name));
  }

  // Returns a set of location IDs that are referenced by inventory batches
  async findReferencedIds(ids: string[]): Promise<Set<string>> {
    if (ids.length === 0) return new Set();
    const rows = await this.db
      .select({ id: inventoryItemBatches.locationId })
      .from(inventoryItemBatches)
      .where(inArray(inventoryItemBatches.locationId, ids));
    const referenced = new Set<string>();
    for (const row of rows) {
      if (row.id) referenced.add(row.id);
    }
    return referenced;
  }

  // Returns a set of location IDs that have child locations
  async findParentIdsWithChildren(ids: string[]): Promise<Set<string>> {
    if (ids.length === 0) return new Set();
    const rows = await this.db
      .select({ id: storageLocations.parentId })
      .from(storageLocations)
      .where(inArray(storageLocations.parentId, ids));
    const parentIds = new Set<string>();
    for (const row of rows) {
      if (row.id) parentIds.add(row.id);
    }
    return parentIds;
  }

  // Counts references to this location across inventory batches
  async countReferences(id: string): Promise<{ inventoryLevels: number; childLocations: number }> {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(inventoryItemBatches)
      .where(eq(inventoryItemBatches.locationId, id));
    const [children] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(storageLocations)
      .where(eq(storageLocations.parentId, id));
    return {
      inventoryLevels: Number(result?.count ?? 0),
      childLocations: Number(children?.count ?? 0),
    };
  }

}
