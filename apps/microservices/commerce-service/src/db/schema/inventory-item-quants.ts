import { and, eq, gt, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type AnyPgColumn,
  bigint,
  check,
  decimal,
  index,
  QueryBuilder,
  timestamp,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { costSourceTypeEnum } from './enums';
import { inventoryItemLots } from './inventory-item-lots';
import { inventoryItems } from './inventory-items';
import { locations } from './locations';
import { suppliers } from './suppliers';
import { uom } from './uom';
import { organizationIdColumn, siteDocumentColumns, siteDocumentPolicies } from './workspace-scope';

export const inventoryItemQuants = commerceSchema.table(
  'inventory_item_quants',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn(),
    ...siteDocumentColumns(),
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id, { onDelete: 'cascade' }),
    locationId: uuid('location_id')
      .notNull()
      .references(() => locations.id),
    lotId: uuid('lot_id').references(() => inventoryItemLots.id, { onDelete: 'restrict' }),
    packUomId: uuid('pack_uom_id').references(() => uom.id, { onDelete: 'restrict' }),
    supplierId: uuid('supplier_id').references(() => suppliers.id, { onDelete: 'restrict' }),
    quantity: decimal('quantity', { precision: 12, scale: 3, mode: 'number' }).notNull().default(0),
    reservedQuantity: decimal('reserved_quantity', { precision: 12, scale: 3, mode: 'number' }).notNull().default(0),
    unitCost: bigint('unit_cost', { mode: 'bigint' }).notNull(),
    costCurrency: varchar('cost_currency', { length: 3 }),
    quantCost: bigint('quant_cost', { mode: 'bigint' }).notNull().default(0n),
    quantValue: bigint('quant_value', { mode: 'bigint' }).notNull().default(0n),
    sourceType: costSourceTypeEnum('source_type'),
    sourceId: uuid('source_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_inventory_item_quants_item').on(table.inventoryItemId),
    index('idx_inventory_item_quants_location').on(table.locationId),
    index('idx_inventory_item_quants_item_location').on(table.inventoryItemId, table.locationId),
    index('idx_inventory_item_quants_item_location_lot').on(table.inventoryItemId, table.locationId, table.lotId),
    index('idx_inventory_item_quants_lot').on(table.lotId),
    index('idx_inventory_item_quants_supplier').on(table.supplierId),
    index('idx_inventory_item_quants_source').on(table.sourceType, table.sourceId),
    index('idx_inventory_item_quants_active')
      .on(table.inventoryItemId, table.locationId)
      .where(sql`${table.quantity} > 0`),
    index('idx_inventory_item_quants_site_item_active')
      .on(table.siteId, table.inventoryItemId)
      .where(sql`${table.quantity} > 0`),
    check('ck_inventory_item_quants_unit_cost_positive', sql`${table.unitCost} > 0`),
    ...siteDocumentPolicies(),
  ],
);

export type InventoryItemQuant = typeof inventoryItemQuants.$inferSelect;
export type NewInventoryItemQuant = typeof inventoryItemQuants.$inferInsert;

export type SiteStockLocation = {
  locationId: string;
  locationName: string;
  locationPath: string;
  quantity: number;
  lotCount: number;
  earliestExpiry: string | null;
};

// Each item's stock at each site per location, with its lot count and earliest expiry there
const siteStockByLocation = new QueryBuilder()
  .select({
    inventoryItemId: inventoryItemQuants.inventoryItemId,
    siteId: inventoryItemQuants.siteId,
    locationId: locations.id,
    locationName: locations.name,
    locationPath: locations.pathBreadcrumb,
    quantity: sql<number>`sum(${inventoryItemQuants.quantity})`.as('quantity'),
    value: sql<string>`sum(${inventoryItemQuants.quantValue})`.as('value'),
    lotCount: sql<number>`count(distinct ${inventoryItemQuants.lotId})`.as('lot_count'),
    earliestExpiry: sql<string | null>`min(${inventoryItemLots.expiryDate})`.as('earliest_expiry'),
  })
  .from(inventoryItemQuants)
  .innerJoin(locations, eq(locations.id, inventoryItemQuants.locationId))
  .leftJoin(inventoryItemLots, eq(inventoryItemLots.id, inventoryItemQuants.lotId))
  .where(gt(inventoryItemQuants.quantity, 0))
  .groupBy(inventoryItemQuants.inventoryItemId, inventoryItemQuants.siteId, locations.id)
  .as('site_stock_by_location');

// Each item's stock at each site the request reaches (RLS narrows the quants): on hand, its value in minor units, and
// the locations holding it, largest first. A query joins it on the item, and on the site too when its rows span sites
export const siteStockByItem = new QueryBuilder()
  .select({
    inventoryItemId: siteStockByLocation.inventoryItemId,
    siteId: siteStockByLocation.siteId,
    onHand: sql<number>`sum(${siteStockByLocation.quantity})`.as('on_hand'),
    value: sql<string>`sum(${siteStockByLocation.value})`.as('stock_value'),
    locations: sql<SiteStockLocation[]>`json_agg(json_build_object(
      'locationId', ${siteStockByLocation.locationId},
      'locationName', ${siteStockByLocation.locationName},
      'locationPath', ${siteStockByLocation.locationPath},
      'quantity', ${siteStockByLocation.quantity},
      'lotCount', ${siteStockByLocation.lotCount},
      'earliestExpiry', ${siteStockByLocation.earliestExpiry}
    ) order by ${siteStockByLocation.quantity} desc)`.as('locations'),
  })
  .from(siteStockByLocation)
  .groupBy(siteStockByLocation.inventoryItemId, siteStockByLocation.siteId)
  .as('site_stock');

// The joined stock on hand, 0 where the site holds none
export const siteStockOnHand = sql<number>`coalesce(${siteStockByItem.onHand}, 0)`;

// The joined stock's value in minor units of the site's currency, 0 where the site holds none
export const siteStockValue = sql<string>`coalesce(${siteStockByItem.value}, 0)`;

// The locations holding the joined stock, none where the site holds none
export const siteStockLocations = sql<SiteStockLocation[]>`coalesce(${siteStockByItem.locations}, '[]'::json)`;

// One item's stock at one site, read per row of the outer query through the active stock index on site and item —
// for a page of rows, where joining the whole site's stock (siteStockByItem) would add up every item the site holds:
// on hand, its value in minor units, and the locations holding it, largest first
export function itemStockAtSite(inventoryItemId: AnyPgColumn, siteId: AnyPgColumn) {
  const held = and(
    eq(inventoryItemQuants.siteId, siteId),
    eq(inventoryItemQuants.inventoryItemId, inventoryItemId),
    gt(inventoryItemQuants.quantity, 0),
  );
  const byLocation = new QueryBuilder()
    .select({
      locationId: locations.id,
      locationName: locations.name,
      locationPath: locations.pathBreadcrumb,
      quantity: sql<number>`sum(${inventoryItemQuants.quantity})`.as('quantity'),
      lotCount: sql<number>`count(distinct ${inventoryItemQuants.lotId})`.as('lot_count'),
      earliestExpiry: sql<string | null>`min(${inventoryItemLots.expiryDate})`.as('earliest_expiry'),
    })
    .from(inventoryItemQuants)
    .innerJoin(locations, eq(locations.id, inventoryItemQuants.locationId))
    .leftJoin(inventoryItemLots, eq(inventoryItemLots.id, inventoryItemQuants.lotId))
    .where(held)
    .groupBy(locations.id)
    .as('item_stock_by_location');
  const onHand = new QueryBuilder()
    .select({ onHand: sql`sum(${inventoryItemQuants.quantity})` })
    .from(inventoryItemQuants)
    .where(held);
  const value = new QueryBuilder()
    .select({ value: sql`sum(${inventoryItemQuants.quantValue})` })
    .from(inventoryItemQuants)
    .where(held);
  const locationList = new QueryBuilder()
    .select({
      locations: sql`json_agg(json_build_object(
        'locationId', ${byLocation.locationId},
        'locationName', ${byLocation.locationName},
        'locationPath', ${byLocation.locationPath},
        'quantity', ${byLocation.quantity},
        'lotCount', ${byLocation.lotCount},
        'earliestExpiry', ${byLocation.earliestExpiry}
      ) order by ${byLocation.quantity} desc)`,
    })
    .from(byLocation);
  return {
    onHand: sql<number>`coalesce((${onHand}), 0)`,
    value: sql<string>`coalesce((${value}), 0)`,
    locations: sql<SiteStockLocation[]>`coalesce((${locationList}), '[]'::json)`,
  };
}
