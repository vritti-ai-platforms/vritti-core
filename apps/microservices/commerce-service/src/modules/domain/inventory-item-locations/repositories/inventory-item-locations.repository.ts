import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { and, desc, eq, inArray, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type InventoryItemLocation,
  inventoryItemLocations,
  inventoryItemQuants,
  storageLocations,
} from '@/db/schema';

@Injectable()
export class InventoryItemLocationsRepository extends PrimaryBaseRepository<typeof inventoryItemLocations> {
  constructor(database: PrimaryDatabaseService) {
    super(database, inventoryItemLocations);
  }

  // Returns paginated configs for an item with location name and aggregated stock
  async findByItemId(
    itemId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
  ): Promise<{
    result: (InventoryItemLocation & {
      locationName: string | null;
      stockedQuantity: string | null;
      reservedQuantity: string | null;
    })[];
    count: number;
  }> {
    const baseWhere = eq(inventoryItemLocations.inventoryItemId, itemId);
    const combinedWhere = options.where ? and(baseWhere, options.where) : baseWhere;
    const { result, count } = await this.findAllAndCount<InventoryItemLocation & { locationName: string | null }>({
      select: {
        id: inventoryItemLocations.id,
        organizationId: inventoryItemLocations.organizationId,
        businessUnitId: inventoryItemLocations.businessUnitId,
        inventoryItemId: inventoryItemLocations.inventoryItemId,
        locationId: inventoryItemLocations.locationId,
        reorderLevel: inventoryItemLocations.reorderLevel,
        createdAt: inventoryItemLocations.createdAt,
        updatedAt: inventoryItemLocations.updatedAt,
        locationName: storageLocations.name,
      },
      leftJoins: [{ table: storageLocations, on: eq(inventoryItemLocations.locationId, storageLocations.id) }],
      where: combinedWhere,
      orderBy: options.orderBy?.length ? options.orderBy : [desc(inventoryItemLocations.createdAt)],
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
    | (InventoryItemLocation & {
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
        id: inventoryItemLocations.id,
        organizationId: inventoryItemLocations.organizationId,
        businessUnitId: inventoryItemLocations.businessUnitId,
        inventoryItemId: inventoryItemLocations.inventoryItemId,
        locationId: inventoryItemLocations.locationId,
        reorderLevel: inventoryItemLocations.reorderLevel,
        createdAt: inventoryItemLocations.createdAt,
        updatedAt: inventoryItemLocations.updatedAt,
        locationName: storageLocations.name,
        stockedQuantity: stockAgg.stockedQuantity,
        reservedQuantity: stockAgg.reservedQuantity,
      })
      .from(inventoryItemLocations)
      .leftJoin(storageLocations, eq(inventoryItemLocations.locationId, storageLocations.id))
      .leftJoin(
        stockAgg,
        and(
          eq(inventoryItemLocations.inventoryItemId, stockAgg.inventoryItemId),
          eq(inventoryItemLocations.locationId, stockAgg.locationId),
        ),
      )
      .where(eq(inventoryItemLocations.id, id));

    return rows[0] as
      | (InventoryItemLocation & {
          locationName: string | null;
          stockedQuantity: string | null;
          reservedQuantity: string | null;
        })
      | undefined;
  }

  // Returns a config by composite key (item + location)
  async findByCompositeKey(itemId: string, locationId: string): Promise<InventoryItemLocation | undefined> {
    return this.model.findFirst({
      where: { inventoryItemId: itemId, locationId },
    });
  }
}
