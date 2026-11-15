import { sql } from '@vritti/api-sdk/drizzle-orm';
import { boolean, index, timestamp, unique, uniqueIndex, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { inventoryItems } from './inventory-items';
import { locations } from './locations';
import { organizationIdColumn, siteDocumentColumns, siteDocumentPolicies } from './workspace-scope';

export const inventoryItemLocations = commerceSchema.table(
  'inventory_item_locations',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn(),
    ...siteDocumentColumns(),
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id, { onDelete: 'cascade' }),
    locationId: uuid('location_id')
      .notNull()
      .references(() => locations.id, { onDelete: 'cascade' }),
    isPreferred: boolean('is_preferred').notNull().default(false),
    isBlocked: boolean('is_blocked').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_inventory_item_locations').on(table.inventoryItemId, table.locationId),
    uniqueIndex('uq_iil_one_preferred').on(table.inventoryItemId, table.siteId).where(sql`is_preferred = true`),
    index('idx_inventory_item_locations_item').on(table.inventoryItemId),
    index('idx_inventory_item_locations_location').on(table.locationId),
    ...siteDocumentPolicies(),
  ],
);

export type InventoryItemLocation = typeof inventoryItemLocations.$inferSelect;
export type NewInventoryItemLocation = typeof inventoryItemLocations.$inferInsert;
