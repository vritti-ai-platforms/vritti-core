import { decimal, index, text, timestamp, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { stockTransferStatusEnum } from './enums';
import { inventoryItems } from './inventory-items';
import { organizationIdColumn, orgIsolationPolicy } from './workspace-scope';

export const stockTransfers = commerceSchema.table(
  'stock_transfers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: organizationIdColumn,
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id),
    fromSiteId: uuid('from_site_id').notNull(),
    toSiteId: uuid('to_site_id').notNull(),
    quantity: decimal('quantity', { precision: 12, scale: 3, mode: 'number' }).notNull(),
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
    index('idx_stock_transfers_from_site').on(table.fromSiteId),
    index('idx_stock_transfers_to_site').on(table.toSiteId),
    orgIsolationPolicy(),
  ],
);

export type StockTransfer = typeof stockTransfers.$inferSelect;
export type NewStockTransfer = typeof stockTransfers.$inferInsert;
