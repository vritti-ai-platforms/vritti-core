import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, eq, getColumns, inArray, ne, type SQL } from '@vritti/api-sdk/drizzle-orm';
import { inventoryItemStorageTypes, locations, type StorageType, storageTypes } from '@/db/schema';
import type { StorageTypeLimitDto } from '../dto/entity/storage-type-limit.dto';

export type StorageTypeWithUsage = StorageType & { locationCount: number; itemCount: number };

@Injectable()
export class StorageTypesDomainRepository extends PrimaryBaseRepository<typeof storageTypes> {
  constructor(database: PrimaryDatabaseService) {
    super(database, storageTypes);
  }

  // Returns a page of storage types with how many locations and items reference each
  findForTable(options: {
    where?: SQL;
    orderBy: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: StorageTypeWithUsage[]; count: number }> {
    return this.findAllAndCount<StorageTypeWithUsage>({ select: this.selection(), ...options });
  }

  // Returns one storage type with how many locations and items reference it
  findDetail(id: string): Promise<StorageTypeWithUsage | undefined> {
    return this.findById<StorageTypeWithUsage>(id, { select: this.selection() });
  }

  // Whether another storage type of the org already uses the code
  isCodeTaken(code: string, excludeId?: string): Promise<boolean> {
    return this.exists(and(eq(storageTypes.code, code), excludeId ? ne(storageTypes.id, excludeId) : undefined) as SQL);
  }

  // Returns the name and weight/volume maxima of the given storage types
  async findLimitsByIds(ids: string[]): Promise<StorageTypeLimitDto[]> {
    if (ids.length === 0) return [];
    return this.db
      .select({
        id: storageTypes.id,
        name: storageTypes.name,
        maxWeight: storageTypes.maxWeight,
        maxVolume: storageTypes.maxVolume,
      })
      .from(storageTypes)
      .where(inArray(storageTypes.id, ids));
  }

  // Selects a storage type with its location and item × storage type reference counts
  private selection() {
    return {
      ...getColumns(storageTypes),
      locationCount: this.db.$count(locations, eq(locations.storageTypeId, storageTypes.id)),
      itemCount: this.db.$count(
        inventoryItemStorageTypes,
        eq(inventoryItemStorageTypes.storageTypeId, storageTypes.id),
      ),
    };
  }
}
