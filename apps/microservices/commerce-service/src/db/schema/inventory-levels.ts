import { sql, eq } from '@vritti/api-sdk/drizzle-orm';
import { coreSchema } from './core-schema';
import { inventoryItemQuants } from './inventory-item-quants';
import { storageLocationConfigs } from './storage-location-configs';

export const inventoryLevels = coreSchema.view('inventory_levels').as((qb) =>
  qb
    .select({
      inventoryItemId: inventoryItemQuants.inventoryItemId,
      locationId: inventoryItemQuants.locationId,
      stockedQuantity: sql<string>`CAST(SUM(${inventoryItemQuants.quantity}) AS TEXT)`.as('stocked_quantity'),
      reservedQuantity: sql<string>`CAST(SUM(${inventoryItemQuants.reservedQuantity}) AS TEXT)`.as('reserved_quantity'),
      availableQuantity: sql<string>`CAST(SUM(${inventoryItemQuants.quantity} - ${inventoryItemQuants.reservedQuantity}) AS TEXT)`.as('available_quantity'),
      reorderLevel: storageLocationConfigs.reorderLevel,
    })
    .from(inventoryItemQuants)
    .leftJoin(
      storageLocationConfigs,
      sql`${inventoryItemQuants.inventoryItemId} = ${storageLocationConfigs.inventoryItemId} AND ${inventoryItemQuants.locationId} = ${storageLocationConfigs.locationId}`,
    )
    .groupBy(inventoryItemQuants.inventoryItemId, inventoryItemQuants.locationId, storageLocationConfigs.reorderLevel),
);

export type InventoryLevelView = typeof inventoryLevels.$inferSelect;
