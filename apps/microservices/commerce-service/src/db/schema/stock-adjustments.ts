import { sql } from '@vritti/api-sdk/drizzle-orm';
import { bigint, index, pgPolicy, text, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { stockAdjustmentStatusEnum, stockAdjustmentTypeEnum } from './enums';
import { inventoryItems } from './inventory-items';

export const stockAdjustments = coreSchema.table(
  'stock_adjustments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    siteId: uuid('site_id').notNull().default(sql.raw("cast(current_setting('app.site_id') as uuid)")),
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id, { onDelete: 'restrict' }),
    code: varchar('code', { length: 50 }).notNull(),
    type: stockAdjustmentTypeEnum('type').notNull(),
    status: stockAdjustmentStatusEnum('status').notNull().default('DRAFT'),
    reason: text('reason'),
    // Operator-entered opening-stock unit cost (BU currency, minor units, per the item's primary UOM).
    // Required for OPENING_STOCK before publish; set on the created quants at publish.
    unitCost: bigint('unit_cost', { mode: 'bigint' }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('uq_stock_adjustments_org_code').on(table.organizationId, table.code),
    index('idx_stock_adjustments_site').on(table.organizationId, table.siteId),
    index('idx_stock_adjustments_item').on(table.inventoryItemId),
    index('idx_stock_adjustments_status').on(table.status),
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

export type StockAdjustment = typeof stockAdjustments.$inferSelect;
export type NewStockAdjustment = typeof stockAdjustments.$inferInsert;
