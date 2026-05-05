import { sql } from '@vritti/api-sdk/drizzle-orm';
import { coreSchema } from './core-schema';
import { inventoryItemLocations } from './inventory-item-locations';
import { inventoryItemQuants } from './inventory-item-quants';

export const inventoryLevels = coreSchema.view('inventory_levels').as((qb) =>
  qb
    .select({
      inventoryItemId: inventoryItemQuants.inventoryItemId,
      locationId: inventoryItemQuants.locationId,
      stockedQuantity: sql<string>`CAST(SUM(${inventoryItemQuants.quantity}) AS TEXT)`.as('stocked_quantity'),
      reservedQuantity: sql<string>`CAST(SUM(${inventoryItemQuants.reservedQuantity}) AS TEXT)`.as('reserved_quantity'),
      availableQuantity: sql<string>`CAST(SUM(${inventoryItemQuants.quantity} - ${inventoryItemQuants.reservedQuantity}) AS TEXT)`.as('available_quantity'),
      reorderLevel: inventoryItemLocations.reorderLevel,
    })
    .from(inventoryItemQuants)
    .leftJoin(
      inventoryItemLocations,
      sql`${inventoryItemQuants.inventoryItemId} = ${inventoryItemLocations.inventoryItemId} AND ${inventoryItemQuants.locationId} = ${inventoryItemLocations.locationId}`,
    )
    .groupBy(inventoryItemQuants.inventoryItemId, inventoryItemQuants.locationId, inventoryItemLocations.reorderLevel),
);

export type InventoryLevelView = typeof inventoryLevels.$inferSelect;
