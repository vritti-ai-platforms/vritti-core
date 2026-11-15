import { sql } from '@vritti/api-sdk/drizzle-orm';
import { index, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { serialStatusEnum } from './enums';
import { inventoryItemQuants } from './inventory-item-quants';
import { inventoryItems } from './inventory-items';
import { organizationIdColumn, orgIsolationPolicy } from './workspace-scope';

export const inventoryItemSerials = commerceSchema.table(
  'inventory_item_serials',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn(),
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
    orgIsolationPolicy(),
  ],
);

export type InventoryItemSerial = typeof inventoryItemSerials.$inferSelect;
export type NewInventoryItemSerial = typeof inventoryItemSerials.$inferInsert;
