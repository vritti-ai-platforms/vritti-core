import { sql } from '@vritti/api-sdk/drizzle-orm';
import { bigint, index, pgPolicy, text, timestamp, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { costCategories } from './cost-categories';
import { coreSchema } from './core-schema';
import { costDistributionMethodEnum, costSourceTypeEnum } from './enums';

// Org-scoped cost row (no business_unit_id) so that future stock-transfer flows can keep the same
// costId reference across BUs via the inventory_item_quant_costs junction. `source_type` +
// `source_id` is polymorphic by design — no DB-level FK; the application enforces integrity.
export const inventoryItemCosts = coreSchema.table(
  'inventory_item_costs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("current_setting('app.org_id')::uuid")),
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
    createdBy: uuid('created_by'),
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
