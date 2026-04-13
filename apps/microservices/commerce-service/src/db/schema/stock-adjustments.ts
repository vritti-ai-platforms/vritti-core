import { index, pgPolicy, text, timestamp, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { sql } from '@vritti/api-sdk/drizzle-orm';
import { stockAdjustmentStatusEnum, stockAdjustmentTypeEnum } from './enums';
import { coreSchema } from './core-schema';
import { inventoryItems } from './inventory-items';

export const stockAdjustments = coreSchema.table(
  'stock_adjustments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql`current_setting('app.org_id')::uuid`),
    businessUnitId: uuid('business_unit_id').notNull().default(sql`current_setting('app.bu_id')::uuid`),
    inventoryItemId: uuid('inventory_item_id').notNull().references(() => inventoryItems.id),
    code: varchar('code', { length: 50 }).notNull(),
    type: stockAdjustmentTypeEnum('type').notNull(),
    status: stockAdjustmentStatusEnum('status').notNull().default('DRAFT'),
    reason: text('reason'),
    createdById: uuid('created_by_id'),
    publishedAt: timestamp('published_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_stock_adjustments_bu').on(table.organizationId, table.businessUnitId),
    index('idx_stock_adjustments_item').on(table.inventoryItemId),
    index('idx_stock_adjustments_status').on(table.status),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = current_setting('app.org_id', true)::uuid`,
    }),
    pgPolicy('bu_ancestor_read', {
      for: 'select',
      using: sql`business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[])`,
    }),
    pgPolicy('bu_write', {
      for: 'insert',
      withCheck: sql`business_unit_id = current_setting('app.bu_id', true)::uuid`,
    }),
    pgPolicy('bu_update', {
      for: 'update',
      using: sql`business_unit_id = current_setting('app.bu_id', true)::uuid`,
    }),
    pgPolicy('bu_delete', {
      for: 'delete',
      using: sql`business_unit_id = current_setting('app.bu_id', true)::uuid`,
    }),
  ],
);

export type StockAdjustment = typeof stockAdjustments.$inferSelect;
export type NewStockAdjustment = typeof stockAdjustments.$inferInsert;
