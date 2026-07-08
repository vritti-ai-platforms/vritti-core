import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, desc, eq, type SQL } from '@vritti/api-sdk/drizzle-orm';
import { type InventoryItemLocation, inventoryItemLocations, locations } from '@/db/schema';

@Injectable()
export class InventoryItemLocationsRepository extends PrimaryBaseRepository<typeof inventoryItemLocations> {
  constructor(database: PrimaryDatabaseService) {
    super(database, inventoryItemLocations);
  }

  // Returns paginated configs for an item with location name + path.
  // The Locations tab is the registry view (reorder thresholds); actual stock figures live on the
  // Stocks tab via the inventory_stock_levels view.
  async findByInventoryItemId(
    inventoryItemId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
  ): Promise<{
    result: (InventoryItemLocation & { locationName: string | null; locationPath: string | null })[];
    count: number;
  }> {
    const baseWhere = eq(inventoryItemLocations.inventoryItemId, inventoryItemId);
    const combinedWhere = options.where ? and(baseWhere, options.where) : baseWhere;
    return this.findAllAndCount<InventoryItemLocation & { locationName: string | null; locationPath: string | null }>({
      select: {
        id: inventoryItemLocations.id,
        organizationId: inventoryItemLocations.organizationId,
        businessUnitId: inventoryItemLocations.businessUnitId,
        inventoryItemId: inventoryItemLocations.inventoryItemId,
        locationId: inventoryItemLocations.locationId,
        reorderLevel: inventoryItemLocations.reorderLevel,
        createdAt: inventoryItemLocations.createdAt,
        updatedAt: inventoryItemLocations.updatedAt,
        locationName: locations.name,
        locationPath: locations.pathBreadcrumb,
      },
      leftJoins: [{ table: locations, on: eq(inventoryItemLocations.locationId, locations.id) }],
      where: combinedWhere,
      orderBy: options.orderBy?.length ? options.orderBy : [desc(inventoryItemLocations.createdAt)],
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Returns a single config by ID with location name + path
  async findByIdWithLocation(
    id: string,
  ): Promise<(InventoryItemLocation & { locationName: string | null; locationPath: string | null }) | undefined> {
    const rows = await this.db
      .select({
        id: inventoryItemLocations.id,
        organizationId: inventoryItemLocations.organizationId,
        businessUnitId: inventoryItemLocations.businessUnitId,
        inventoryItemId: inventoryItemLocations.inventoryItemId,
        locationId: inventoryItemLocations.locationId,
        reorderLevel: inventoryItemLocations.reorderLevel,
        createdAt: inventoryItemLocations.createdAt,
        updatedAt: inventoryItemLocations.updatedAt,
        locationName: locations.name,
        locationPath: locations.pathBreadcrumb,
      })
      .from(inventoryItemLocations)
      .leftJoin(locations, eq(inventoryItemLocations.locationId, locations.id))
      .where(eq(inventoryItemLocations.id, id));

    return rows[0] as
      | (InventoryItemLocation & { locationName: string | null; locationPath: string | null })
      | undefined;
  }

  // Returns a config by composite key (item + location)
  async findByCompositeKey(inventoryItemId: string, locationId: string): Promise<InventoryItemLocation | undefined> {
    return this.model.findFirst({
      where: { inventoryItemId: inventoryItemId, locationId },
    });
  }
}
