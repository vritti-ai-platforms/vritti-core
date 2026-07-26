import { sql } from '@vritti/api-sdk/drizzle-orm';
import { index, pgPolicy, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { stockAdjustmentLines } from './stock-adjustment-lines';

export const stockAdjustmentLineItems = commerceSchema.table(
  'stock_adjustment_line_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    siteId: uuid('site_id').notNull().default(sql.raw("cast(current_setting('app.site_id') as uuid)")),
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

export type StockAdjustmentLineItem = typeof stockAdjustmentLineItems.$inferSelect;
export type NewStockAdjustmentLineItem = typeof stockAdjustmentLineItems.$inferInsert;
