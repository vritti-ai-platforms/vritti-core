import { sql } from '@vritti/api-sdk/drizzle-orm';
import { bigint, index, pgPolicy, primaryKey, timestamp, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { inventoryItemCosts } from './inventory-item-costs';
import { inventoryItemQuants } from './inventory-item-quants';

// Junction allocating slices of an inventory_item_cost across quants. `allocated_amount` is the
// portion of the cost pinned to one quant; the rows for a single quant sum to that quant's total
// cost, and the rows for a single cost sum to (cost.total_amount − cost.unallocated_amount). Residual
// rounding is absorbed in the allocations so the sums reconcile exactly.
export const inventoryItemQuantCosts = commerceSchema.table(
  'inventory_item_quant_costs',
  {
    quantId: uuid('quant_id')
      .notNull()
      .references(() => inventoryItemQuants.id, { onDelete: 'cascade' }),
    costId: uuid('cost_id')
      .notNull()
      .references(() => inventoryItemCosts.id, { onDelete: 'restrict' }),
    allocatedAmount: bigint('allocated_amount', { mode: 'bigint' }).notNull(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ name: 'pk_inventory_item_quant_costs', columns: [table.quantId, table.costId] }),
    index('idx_inventory_item_quant_costs_cost').on(table.costId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
  ],
);

export type InventoryItemQuantCost = typeof inventoryItemQuantCosts.$inferSelect;
export type NewInventoryItemQuantCost = typeof inventoryItemQuantCosts.$inferInsert;
