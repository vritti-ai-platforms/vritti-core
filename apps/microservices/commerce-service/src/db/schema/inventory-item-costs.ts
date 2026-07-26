import { sql } from '@vritti/api-sdk/drizzle-orm';
import { bigint, index, pgPolicy, text, timestamp, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { costCategories } from './cost-categories';
import { costDistributionMethodEnum, costSourceTypeEnum } from './enums';

// Org-scoped cost header (no site_id). One row per cost event to distribute across quants —
// e.g. the supplier price on a goods receipt, or a freight/duty invoice. `total_amount` is the amount
// to allocate; `unallocated_amount` tracks what is not yet pinned to quants. The per-quant slices live
// in inventory_item_quant_costs and must sum to (total_amount − unallocated_amount).
export const inventoryItemCosts = commerceSchema.table(
  'inventory_item_costs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => costCategories.id, { onDelete: 'restrict' }),
    totalAmount: bigint('total_amount', { mode: 'bigint' }).notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
    sourceType: costSourceTypeEnum('source_type').notNull(),
    sourceId: uuid('source_id').notNull(),
    distributionMethod: costDistributionMethodEnum('distribution_method').notNull().default('by_value'),
    unallocatedAmount: bigint('unallocated_amount', { mode: 'bigint' }).notNull().default(0n),
    vendorRef: varchar('vendor_ref', { length: 100 }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_inventory_item_costs_source').on(table.sourceType, table.sourceId),
    index('idx_inventory_item_costs_category').on(table.categoryId, table.sourceType, table.sourceId),
    index('idx_inventory_item_costs_created_at').on(table.createdAt),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
  ],
);

export type InventoryItemCost = typeof inventoryItemCosts.$inferSelect;
export type NewInventoryItemCost = typeof inventoryItemCosts.$inferInsert;
