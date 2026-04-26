import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { and, desc, eq, inArray, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  inventoryItemQuants,
  type StorageLocationConfig,
  storageLocationConfigs,
  storageLocations,
} from '@/db/schema';

@Injectable()
export class StorageLocationConfigsRepository extends PrimaryBaseRepository<typeof storageLocationConfigs> {
  constructor(database: PrimaryDatabaseService) {
    super(database, storageLocationConfigs);
  }

  // Returns paginated configs for an item with location name and aggregated stock
  async findByItemId(
    itemId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
  ): Promise<{
    result: (StorageLocationConfig & {
      locationName: string | null;
      stockedQuantity: string | null;
      reservedQuantity: string | null;
    })[];
    count: number;
  }> {
    const baseWhere = eq(storageLocationConfigs.inventoryItemId, itemId);
    const combinedWhere = options.where ? and(baseWhere, options.where) : baseWhere;
    const { result, count } = await this.findAllAndCount<StorageLocationConfig & { locationName: string | null }>({
      select: {
        id: storageLocationConfigs.id,
        organizationId: storageLocationConfigs.organizationId,
        businessUnitId: storageLocationConfigs.businessUnitId,
        inventoryItemId: storageLocationConfigs.inventoryItemId,
        locationId: storageLocationConfigs.locationId,
        reorderLevel: storageLocationConfigs.reorderLevel,
        createdAt: storageLocationConfigs.createdAt,
        updatedAt: storageLocationConfigs.updatedAt,
        locationName: storageLocations.name,
      },
      leftJoins: [{ table: storageLocations, on: eq(storageLocationConfigs.locationId, storageLocations.id) }],
      where: combinedWhere,
      orderBy: options.orderBy?.length ? options.orderBy : [desc(storageLocationConfigs.createdAt)],
      limit: options.limit,
      offset: options.offset,
    });

    if (result.length === 0) {
      return { result: [], count };
    }

    const locationIds = result.map((row) => row.locationId);
    const stockRows = await this.db
      .select({
        locationId: inventoryItemQuants.locationId,
        stockedQuantity: sql<string>`CAST(SUM(${inventoryItemQuants.quantity}) AS TEXT)`,
        reservedQuantity: sql<string>`CAST(SUM(${inventoryItemQuants.reservedQuantity}) AS TEXT)`,
      })
      .from(inventoryItemQuants)
      .where(and(eq(inventoryItemQuants.inventoryItemId, itemId), inArray(inventoryItemQuants.locationId, locationIds)))
      .groupBy(inventoryItemQuants.locationId);

    const stockByLocation = new Map(
      stockRows.map((row) => [
        row.locationId,
        {
          stockedQuantity: row.stockedQuantity,
          reservedQuantity: row.reservedQuantity,
        },
      ]),
    );

    return {
      result: result.map((row) => ({
        ...row,
        stockedQuantity: stockByLocation.get(row.locationId)?.stockedQuantity ?? null,
        reservedQuantity: stockByLocation.get(row.locationId)?.reservedQuantity ?? null,
      })),
      count,
    };
  }

  // Returns a single config by ID with location name and aggregated stock
  async findByIdWithLocation(id: string): Promise<
    | (StorageLocationConfig & {
        locationName: string | null;
        stockedQuantity: string | null;
        reservedQuantity: string | null;
      })
    | undefined
  > {
    // Subquery: aggregate stock per (inventoryItemId, locationId)
    const stockAgg = this.db
      .select({
        inventoryItemId: inventoryItemQuants.inventoryItemId,
        locationId: inventoryItemQuants.locationId,
        stockedQuantity: sql<string>`CAST(SUM(${inventoryItemQuants.quantity}) AS TEXT)`.as('stocked_quantity'),
        reservedQuantity: sql<string>`CAST(SUM(${inventoryItemQuants.reservedQuantity}) AS TEXT)`.as(
          'reserved_quantity',
        ),
      })
      .from(inventoryItemQuants)
      .groupBy(inventoryItemQuants.inventoryItemId, inventoryItemQuants.locationId)
      .as('stock_agg');

    const rows = await this.db
      .select({
        id: storageLocationConfigs.id,
        organizationId: storageLocationConfigs.organizationId,
        businessUnitId: storageLocationConfigs.businessUnitId,
        inventoryItemId: storageLocationConfigs.inventoryItemId,
        locationId: storageLocationConfigs.locationId,
        reorderLevel: storageLocationConfigs.reorderLevel,
        createdAt: storageLocationConfigs.createdAt,
        updatedAt: storageLocationConfigs.updatedAt,
        locationName: storageLocations.name,
        stockedQuantity: stockAgg.stockedQuantity,
        reservedQuantity: stockAgg.reservedQuantity,
      })
      .from(storageLocationConfigs)
      .leftJoin(storageLocations, eq(storageLocationConfigs.locationId, storageLocations.id))
      .leftJoin(
        stockAgg,
        and(
          eq(storageLocationConfigs.inventoryItemId, stockAgg.inventoryItemId),
          eq(storageLocationConfigs.locationId, stockAgg.locationId),
        ),
      )
      .where(eq(storageLocationConfigs.id, id));

    return rows[0] as
      | (StorageLocationConfig & {
          locationName: string | null;
          stockedQuantity: string | null;
          reservedQuantity: string | null;
        })
      | undefined;
  }

  // Returns a config by composite key (item + location)
  async findByCompositeKey(itemId: string, locationId: string): Promise<StorageLocationConfig | undefined> {
    return this.model.findFirst({
      where: { inventoryItemId: itemId, locationId },
    });
  }
}
