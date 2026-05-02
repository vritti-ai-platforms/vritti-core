import { index, pgPolicy, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { sql } from '@vritti/api-sdk/drizzle-orm';
import { coreSchema } from './core-schema';
import { quantItemStatusEnum } from './enums';
import { inventoryItemQuants } from './inventory-item-quants';
import { inventoryItems } from './inventory-items';

export const inventoryItemQuantItems = coreSchema.table(
  'inventory_item_quant_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("current_setting('app.org_id')::uuid")),
    businessUnitId: uuid('business_unit_id').notNull().default(sql.raw("current_setting('app.bu_id')::uuid")),
    inventoryItemQuantId: uuid('inventory_item_quant_id')
      .notNull()
      .references(() => inventoryItemQuants.id, { onDelete: 'cascade' }),
    inventoryItemId: uuid('inventory_item_id').notNull().references(() => inventoryItems.id, { onDelete: 'restrict' }),
    serialNumber: varchar('serial_number', { length: 100 }).notNull(),
    status: quantItemStatusEnum('status').notNull().default('AVAILABLE'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_inventory_quant_items_serial').on(table.organizationId, table.inventoryItemId, table.serialNumber),
    index('idx_inventory_quant_items_quant').on(table.inventoryItemQuantId),
    index('idx_inventory_quant_items_item').on(table.inventoryItemId),
    index('idx_inventory_quant_items_quant_status').on(table.inventoryItemQuantId, table.status),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
    pgPolicy('bu_ancestor_read', {
      for: 'select',
      using: sql`business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[])`,
    }),
    pgPolicy('bu_write', {
      for: 'insert',
      withCheck: sql`business_unit_id = (select current_setting('app.bu_id', true)::uuid)`,
    }),
    pgPolicy('bu_update', {
      for: 'update',
      using: sql`business_unit_id = (select current_setting('app.bu_id', true)::uuid)`,
    }),
    pgPolicy('bu_delete', {
      for: 'delete',
      using: sql`business_unit_id = (select current_setting('app.bu_id', true)::uuid)`,
    }),
  ],
);

export type InventoryItemQuantItem = typeof inventoryItemQuantItems.$inferSelect;
export type NewInventoryItemQuantItem = typeof inventoryItemQuantItems.$inferInsert;
