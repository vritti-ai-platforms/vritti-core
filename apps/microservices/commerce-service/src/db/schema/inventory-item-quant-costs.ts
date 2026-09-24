import { bigint, index, primaryKey, timestamp, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { inventoryItemCosts } from './inventory-item-costs';
import { inventoryItemQuants } from './inventory-item-quants';
import { organizationIdColumn, orgIsolationPolicy } from './workspace-scope';

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
    organizationId: organizationIdColumn,
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ name: 'pk_inventory_item_quant_costs', columns: [table.quantId, table.costId] }),
    index('idx_inventory_item_quant_costs_cost').on(table.costId),
    orgIsolationPolicy(),
  ],
);

export type InventoryItemQuantCost = typeof inventoryItemQuantCosts.$inferSelect;
export type NewInventoryItemQuantCost = typeof inventoryItemQuantCosts.$inferInsert;
