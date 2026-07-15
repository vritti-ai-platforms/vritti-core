import { sql } from '@vritti/api-sdk/drizzle-orm';
import { bigint, pgPolicy, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { inventoryItemLots } from './inventory-item-lots';
import { inventoryItems } from './inventory-items';

export const inventoryItemMrps = coreSchema.table(
  'inventory_item_mrps',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id, { onDelete: 'cascade' }),
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
    amount: bigint('amount', { mode: 'bigint' }).notNull(),
    sourceLotId: uuid('source_lot_id').references(() => inventoryItemLots.id, { onDelete: 'set null' }),
    sourcedAt: timestamp('sourced_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_inventory_item_mrps_item_currency').on(table.inventoryItemId, table.currencyCode),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
  ],
);

export type InventoryItemMrp = typeof inventoryItemMrps.$inferSelect;
export type NewInventoryItemMrp = typeof inventoryItemMrps.$inferInsert;
