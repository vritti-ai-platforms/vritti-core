import { sql } from '@vritti/api-sdk/drizzle-orm';
import { bigint, index, pgPolicy, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { inventoryItemLots } from './inventory-item-lots';
import { inventoryItems } from './inventory-items';
import { uom } from './uom';

export const inventoryItemMrps = commerceSchema.table(
  'inventory_item_mrps',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id, { onDelete: 'cascade' }),
    uomId: uuid('uom_id')
      .notNull()
      .references(() => uom.id),
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
    unique('uq_inventory_item_mrps_item_uom_currency').on(table.inventoryItemId, table.uomId, table.currencyCode),
    index('idx_inventory_item_mrps_uom').on(table.uomId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
  ],
);

export type InventoryItemMrp = typeof inventoryItemMrps.$inferSelect;
export type NewInventoryItemMrp = typeof inventoryItemMrps.$inferInsert;
