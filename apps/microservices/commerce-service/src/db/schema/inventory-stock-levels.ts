import { sql } from '@vritti/api-sdk/drizzle-orm';
import { commerceSchema } from './commerce-schema';
import { inventoryItemLocations } from './inventory-item-locations';
import { inventoryItemQuants } from './inventory-item-quants';

// Per-(item, location) stock view. FULL OUTER JOIN between aggregated quants and the locations
// registry so the result includes:
//   - stock-only rows (quants exist, no inventory_item_locations row) → reorderLevel NULL
//   - config-only rows (registry row exists, no stock yet)            → stocked/reserved/available 0
//   - both                                                            → fully populated
export const inventoryStockLevels = commerceSchema.view('inventory_stock_levels').as((qb) => {
  const quantAggs = qb
    .select({
      inventoryItemId: inventoryItemQuants.inventoryItemId,
      locationId: inventoryItemQuants.locationId,
      stocked: sql<string>`SUM(${inventoryItemQuants.quantity})`.as('stocked'),
      reserved: sql<string>`SUM(${inventoryItemQuants.reservedQuantity})`.as('reserved'),
      available: sql<string>`SUM(${inventoryItemQuants.quantity} - ${inventoryItemQuants.reservedQuantity})`.as(
        'available',
      ),
    })
    .from(inventoryItemQuants)
    .groupBy(inventoryItemQuants.inventoryItemId, inventoryItemQuants.locationId)
    .as('q');

  return qb
    .select({
      inventoryItemId:
        sql<string>`COALESCE(${quantAggs.inventoryItemId}, ${inventoryItemLocations.inventoryItemId})`.as(
          'inventory_item_id',
        ),
      locationId: sql<string>`COALESCE(${quantAggs.locationId}, ${inventoryItemLocations.locationId})`.as(
        'location_id',
      ),
      stockedQuantity: sql<string>`CAST(COALESCE(${quantAggs.stocked}, 0) AS TEXT)`.as('stocked_quantity'),
      reservedQuantity: sql<string>`CAST(COALESCE(${quantAggs.reserved}, 0) AS TEXT)`.as('reserved_quantity'),
      availableQuantity: sql<string>`CAST(COALESCE(${quantAggs.available}, 0) AS TEXT)`.as('available_quantity'),
      reorderLevel: inventoryItemLocations.minLevel,
    })
    .from(quantAggs)
    .fullJoin(
      inventoryItemLocations,
      sql`${quantAggs.inventoryItemId} = ${inventoryItemLocations.inventoryItemId} AND ${quantAggs.locationId} = ${inventoryItemLocations.locationId}`,
    );
});

export type InventoryStockLevelView = typeof inventoryStockLevels.$inferSelect;
