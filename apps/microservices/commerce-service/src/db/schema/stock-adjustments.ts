import { sql } from '@vritti/api-sdk/drizzle-orm';
import { bigint, index, text, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { stockAdjustmentStatusEnum, stockAdjustmentTypeEnum } from './enums';
import { inventoryItems } from './inventory-items';
import { organizationIdColumn, siteDocumentColumns, siteDocumentPolicies } from './workspace-scope';

export const stockAdjustments = commerceSchema.table(
  'stock_adjustments',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn(),
    ...siteDocumentColumns(),
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id, { onDelete: 'restrict' }),
    code: varchar('code', { length: 50 }).notNull(),
    type: stockAdjustmentTypeEnum('type').notNull(),
    status: stockAdjustmentStatusEnum('status').notNull().default('DRAFT'),
    reason: text('reason'),
    unitCost: bigint('unit_cost', { mode: 'bigint' }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('uq_stock_adjustments_org_code').on(table.organizationId, table.code),
    index('idx_stock_adjustments_site').on(table.organizationId, table.siteId),
    index('idx_stock_adjustments_item').on(table.inventoryItemId),
    index('idx_stock_adjustments_status').on(table.status),
    ...siteDocumentPolicies(),
  ],
);

export type StockAdjustment = typeof stockAdjustments.$inferSelect;
export type NewStockAdjustment = typeof stockAdjustments.$inferInsert;
