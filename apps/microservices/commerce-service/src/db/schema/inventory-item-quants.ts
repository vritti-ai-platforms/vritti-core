import { sql } from '@vritti/api-sdk/drizzle-orm';
import { decimal, index, pgPolicy, timestamp, unique, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { inventoryItemLots } from './inventory-item-lots';
import { inventoryItems } from './inventory-items';
import { storageLocations } from './storage-locations';

export const inventoryItemQuants = coreSchema.table(
  'inventory_item_quants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql`current_setting('app.org_id')::uuid`),
    businessUnitId: uuid('business_unit_id').notNull().default(sql`current_setting('app.bu_id')::uuid`),
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id, { onDelete: 'cascade' }),
    locationId: uuid('location_id')
      .notNull()
      .references(() => storageLocations.id),
    lotId: uuid('lot_id').references(() => inventoryItemLots.id, { onDelete: 'restrict' }),
    quantity: decimal('quantity', { precision: 12, scale: 3 }).notNull().default('0'),
    reservedQuantity: decimal('reserved_quantity', { precision: 12, scale: 3 }).notNull().default('0'),
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
    index('idx_inventory_item_quants_lot').on(table.lotId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = current_setting('app.org_id', true)::uuid`,
    }),
    pgPolicy('bu_ancestor_read', {
      for: 'select',
      using: sql`business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[])`,
    }),
    pgPolicy('bu_write', {
      for: 'insert',
      withCheck: sql`business_unit_id = current_setting('app.bu_id', true)::uuid`,
    }),
    pgPolicy('bu_update', {
      for: 'update',
      using: sql`business_unit_id = current_setting('app.bu_id', true)::uuid`,
    }),
    pgPolicy('bu_delete', {
      for: 'delete',
      using: sql`business_unit_id = current_setting('app.bu_id', true)::uuid`,
    }),
  ],
);

export type InventoryItemQuant = typeof inventoryItemQuants.$inferSelect;
export type NewInventoryItemQuant = typeof inventoryItemQuants.$inferInsert;
