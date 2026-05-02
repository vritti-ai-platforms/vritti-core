import { sql } from '@vritti/api-sdk/drizzle-orm';
import { decimal, index, pgPolicy, text, timestamp, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { stockTransferStatusEnum } from './enums';
import { inventoryItems } from './inventory-items';

export const stockTransfers = coreSchema.table(
  'stock_transfers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("current_setting('app.org_id')::uuid")),
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id),
    fromBuId: uuid('from_bu_id').notNull(),
    toBuId: uuid('to_bu_id').notNull(),
    quantity: decimal('quantity', { precision: 12, scale: 3 }).notNull(),
    status: stockTransferStatusEnum('status').notNull().default('REQUESTED'),
    requestedBy: uuid('requested_by'),
    receivedBy: uuid('received_by'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_stock_transfers_item').on(table.inventoryItemId),
    index('idx_stock_transfers_from_bu').on(table.fromBuId),
    index('idx_stock_transfers_to_bu').on(table.toBuId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
  ],
);

export type StockTransfer = typeof stockTransfers.$inferSelect;
export type NewStockTransfer = typeof stockTransfers.$inferInsert;
