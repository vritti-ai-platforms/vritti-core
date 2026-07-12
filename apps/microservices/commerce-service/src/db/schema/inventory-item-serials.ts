import { sql } from '@vritti/api-sdk/drizzle-orm';
import { index, pgPolicy, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { serialStatusEnum } from './enums';
import { inventoryItemQuants } from './inventory-item-quants';
import { inventoryItems } from './inventory-items';

export const inventoryItemSerials = coreSchema.table(
  'inventory_item_serials',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    siteId: uuid('site_id').notNull().default(sql.raw("cast(current_setting('app.site_id') as uuid)")),
    inventoryItemQuantId: uuid('inventory_item_quant_id').references(() => inventoryItemQuants.id, {
      onDelete: 'set null',
    }),
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id, { onDelete: 'restrict' }),
    serialNumber: varchar('serial_number', { length: 100 }).notNull(),
    status: serialStatusEnum('status').notNull().default('AVAILABLE'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_inventory_item_serials_serial').on(table.organizationId, table.inventoryItemId, table.serialNumber),
    index('idx_inventory_item_serials_quant').on(table.inventoryItemQuantId),
    index('idx_inventory_item_serials_item').on(table.inventoryItemId),
    index('idx_inventory_item_serials_quant_status').on(table.inventoryItemQuantId, table.status),
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

export type InventoryItemSerial = typeof inventoryItemSerials.$inferSelect;
export type NewInventoryItemSerial = typeof inventoryItemSerials.$inferInsert;
