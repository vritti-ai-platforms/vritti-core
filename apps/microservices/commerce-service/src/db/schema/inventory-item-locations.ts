import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  boolean,
  decimal,
  index,
  pgPolicy,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { inventoryItems } from './inventory-items';
import { locations } from './locations';

export const inventoryItemLocations = coreSchema.table(
  'inventory_item_locations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    siteId: uuid('site_id').notNull().default(sql.raw("cast(current_setting('app.site_id') as uuid)")),
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id, { onDelete: 'cascade' }),
    locationId: uuid('location_id')
      .notNull()
      .references(() => locations.id, { onDelete: 'cascade' }),
    isPreferred: boolean('is_preferred').notNull().default(false),
    minLevel: decimal('min_level', { precision: 12, scale: 3, mode: 'number' }).notNull().default(0),
    maxLevel: decimal('max_level', { precision: 12, scale: 3, mode: 'number' }).notNull().default(0),
    safetyStock: decimal('safety_stock', { precision: 12, scale: 3, mode: 'number' }).notNull().default(0),
    binCapacity: decimal('bin_capacity', { precision: 12, scale: 3, mode: 'number' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_inventory_item_locations').on(table.inventoryItemId, table.locationId),
    // At most one preferred location per (item, site).
    uniqueIndex('uq_iil_one_preferred').on(table.inventoryItemId, table.siteId).where(sql`is_preferred = true`),
    index('idx_inventory_item_locations_item').on(table.inventoryItemId),
    index('idx_inventory_item_locations_location').on(table.locationId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
    pgPolicy('site_read', {
      for: 'select',
      using: sql`site_id = (select current_setting('app.site_id', true)::uuid)`,
    }),
    pgPolicy('site_write', {
      for: 'insert',
      withCheck: sql`site_id = (select current_setting('app.site_id', true)::uuid)`,
    }),
    pgPolicy('site_update', {
      for: 'update',
      using: sql`site_id = (select current_setting('app.site_id', true)::uuid)`,
    }),
    pgPolicy('site_delete', {
      for: 'delete',
      using: sql`site_id = (select current_setting('app.site_id', true)::uuid)`,
    }),
  ],
);

export type InventoryItemLocation = typeof inventoryItemLocations.$inferSelect;
export type NewInventoryItemLocation = typeof inventoryItemLocations.$inferInsert;
