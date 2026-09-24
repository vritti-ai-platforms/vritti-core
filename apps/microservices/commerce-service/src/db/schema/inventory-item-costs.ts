import { bigint, index, text, timestamp, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { costCategories } from './cost-categories';
import { costDistributionMethodEnum, costSourceTypeEnum } from './enums';
import { organizationIdColumn, orgIsolationPolicy } from './workspace-scope';

export const inventoryItemCosts = commerceSchema.table(
  'inventory_item_costs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: organizationIdColumn,
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
    orgIsolationPolicy(),
  ],
);

export type InventoryItemCost = typeof inventoryItemCosts.$inferSelect;
export type NewInventoryItemCost = typeof inventoryItemCosts.$inferInsert;
