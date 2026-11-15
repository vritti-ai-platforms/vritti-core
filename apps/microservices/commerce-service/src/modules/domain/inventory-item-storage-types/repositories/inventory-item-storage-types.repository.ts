import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, eq, getColumns, gt, inArray, sql } from '@vritti/api-sdk/drizzle-orm';
import { inventoryItemQuants, inventoryItemStorageTypes, locations, storageTypes, uom } from '@/db/schema';
import type { InventoryItemStorageTypeRow } from '../dto/entity/inventory-item-storage-type.dto';
import type { StorageAllowanceDto } from '../dto/entity/storage-usage-rule.dto';

@Injectable()
export class InventoryItemStorageTypesDomainRepository extends PrimaryBaseRepository<typeof inventoryItemStorageTypes> {
  constructor(database: PrimaryDatabaseService) {
    super(database, inventoryItemStorageTypes);
  }

  // Returns the storage types an item may be stored in, with type name and unit symbol, by type name
  findAllByInventoryItemId(inventoryItemId: string): Promise<InventoryItemStorageTypeRow[]> {
    return this.findAllWithSelect<InventoryItemStorageTypeRow>({
      select: this.selection(),
      innerJoins: this.joins(),
      where: eq(inventoryItemStorageTypes.inventoryItemId, inventoryItemId),
      orderBy: [asc(storageTypes.name)],
    });
  }

  // Returns one item × storage type row with type name and unit symbol
  findDetail(id: string): Promise<InventoryItemStorageTypeRow | undefined> {
    return this.findById<InventoryItemStorageTypeRow>(id, { select: this.selection(), innerJoins: this.joins() });
  }

  // Whether the item already has a row for the storage type
  async existsForItemAndType(inventoryItemId: string, storageTypeId: string): Promise<boolean> {
    const row = await this.model.findFirst({ where: { inventoryItemId, storageTypeId } });
    return row !== undefined;
  }

  // Returns the rows pairing any of the items with any of the storage types
  async findAllowances(inventoryItemIds: string[], storageTypeIds: string[]): Promise<StorageAllowanceDto[]> {
    if (inventoryItemIds.length === 0 || storageTypeIds.length === 0) return [];
    return this.db
      .select({
        inventoryItemId: inventoryItemStorageTypes.inventoryItemId,
        storageTypeId: inventoryItemStorageTypes.storageTypeId,
        maxQuantity: inventoryItemStorageTypes.maxQuantity,
        uomId: inventoryItemStorageTypes.uomId,
      })
      .from(inventoryItemStorageTypes)
      .where(
        and(
          inArray(inventoryItemStorageTypes.inventoryItemId, inventoryItemIds),
          inArray(inventoryItemStorageTypes.storageTypeId, storageTypeIds),
        ),
      );
  }

  // Names of the locations of a storage type that currently hold stock of the item
  async findStockedLocationNames(inventoryItemId: string, storageTypeId: string): Promise<string[]> {
    const rows = await this.db
      .selectDistinct({ name: sql<string>`coalesce(${locations.pathBreadcrumb}, ${locations.name})` })
      .from(inventoryItemQuants)
      .innerJoin(locations, eq(inventoryItemQuants.locationId, locations.id))
      .where(
        and(
          eq(inventoryItemQuants.inventoryItemId, inventoryItemId),
          eq(locations.storageTypeId, storageTypeId),
          gt(inventoryItemQuants.quantity, 0),
        ),
      );
    return rows.map((row) => row.name);
  }

  // Selects a row with its storage type name and unit symbol
  private selection() {
    return {
      ...getColumns(inventoryItemStorageTypes),
      storageTypeName: storageTypes.name,
      uomSymbol: uom.symbol,
    };
  }

  // Joins the storage type and the unit a row's max quantity is counted in
  private joins() {
    return [
      { table: storageTypes, on: eq(inventoryItemStorageTypes.storageTypeId, storageTypes.id) },
      { table: uom, on: eq(inventoryItemStorageTypes.uomId, uom.id) },
    ];
  }
}
