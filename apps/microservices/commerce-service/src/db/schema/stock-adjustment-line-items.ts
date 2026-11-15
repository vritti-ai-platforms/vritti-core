import { sql } from '@vritti/api-sdk/drizzle-orm';
import { index, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { stockAdjustmentLines } from './stock-adjustment-lines';
import { stockAdjustments } from './stock-adjustments';
import { organizationIdColumn, scopeFromOwnerPolicies, siteIdColumn } from './workspace-scope';

export const stockAdjustmentLineItems = commerceSchema.table(
  'stock_adjustment_line_items',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn(),
    siteId: siteIdColumn().notNull(),
    stockAdjustmentLineId: uuid('stock_adjustment_line_id')
      .notNull()
      .references(() => stockAdjustmentLines.id, { onDelete: 'cascade' }),
    serialNumber: varchar('serial_number', { length: 100 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_stock_adjustment_line_items_line_serial').on(table.stockAdjustmentLineId, table.serialNumber),
    index('idx_sa_line_items_line').on(table.stockAdjustmentLineId),
    ...scopeFromOwnerPolicies({
      owner: stockAdjustments,
      fk: table.stockAdjustmentLineId,
      through: [{ table: stockAdjustmentLines, fk: (line) => line.stockAdjustmentId }],
      ownerIs: 'siteDocument',
    }),
  ],
);

export type StockAdjustmentLineItem = typeof stockAdjustmentLineItems.$inferSelect;
export type NewStockAdjustmentLineItem = typeof stockAdjustmentLineItems.$inferInsert;
