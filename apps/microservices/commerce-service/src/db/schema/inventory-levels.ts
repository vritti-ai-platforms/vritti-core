import { sql, eq } from '@vritti/api-sdk/drizzle-orm';
import { coreSchema } from './core-schema';
import { inventoryItemBatches } from './inventory-item-batches';
import { storageLocationConfigs } from './storage-location-configs';

export const inventoryLevels = coreSchema.view('inventory_levels').as((qb) =>
  qb
    .select({
      inventoryItemId: inventoryItemBatches.inventoryItemId,
      locationId: inventoryItemBatches.locationId,
      stockedQuantity: sql<string>`CAST(SUM(${inventoryItemBatches.quantity}) AS TEXT)`.as('stocked_quantity'),
      reservedQuantity: sql<string>`CAST(SUM(${inventoryItemBatches.reservedQuantity}) AS TEXT)`.as('reserved_quantity'),
      availableQuantity: sql<string>`CAST(SUM(${inventoryItemBatches.quantity} - ${inventoryItemBatches.reservedQuantity}) AS TEXT)`.as('available_quantity'),
      reorderLevel: storageLocationConfigs.reorderLevel,
    })
    .from(inventoryItemBatches)
    .leftJoin(
      storageLocationConfigs,
      sql`${inventoryItemBatches.inventoryItemId} = ${storageLocationConfigs.inventoryItemId} AND ${inventoryItemBatches.locationId} = ${storageLocationConfigs.locationId}`,
    )
    .groupBy(inventoryItemBatches.inventoryItemId, inventoryItemBatches.locationId, storageLocationConfigs.reorderLevel),
);

export type InventoryLevelView = typeof inventoryLevels.$inferSelect;
