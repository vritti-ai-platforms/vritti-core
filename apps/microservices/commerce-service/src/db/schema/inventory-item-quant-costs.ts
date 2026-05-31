import { sql } from '@vritti/api-sdk/drizzle-orm';
import { bigint, index, pgPolicy, primaryKey, timestamp, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { inventoryItemCosts } from './inventory-item-costs';
import { inventoryItemQuants } from './inventory-item-quants';

// Junction edge with allocated amount: many cost rows can contribute to one quant, and one cost
// row can split across many quants. The signed minor-units `allocated_amount` is what each cost
// row contributed to this quant; the quant's denormalized `unit_cost` is recomputed from
// `SUM(allocated_amount) / quantity` after each association.
export const inventoryItemQuantCosts = coreSchema.table(
  'inventory_item_quant_costs',
  {
    quantId: uuid('quant_id')
      .notNull()
      .references(() => inventoryItemQuants.id, { onDelete: 'cascade' }),
    costId: uuid('cost_id')
      .notNull()
      .references(() => inventoryItemCosts.id, { onDelete: 'restrict' }),
    allocatedAmount: bigint('allocated_amount', { mode: 'bigint' }).notNull(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("current_setting('app.org_id')::uuid")),
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
