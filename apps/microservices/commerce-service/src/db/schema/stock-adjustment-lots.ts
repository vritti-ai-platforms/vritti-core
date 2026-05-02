import { sql } from '@vritti/api-sdk/drizzle-orm';
import { index, jsonb, pgPolicy, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { inventoryItemLots } from './inventory-item-lots';
import { stockAdjustments } from './stock-adjustments';

export const stockAdjustmentLots = coreSchema.table(
  'stock_adjustment_lots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("current_setting('app.org_id')::uuid")),
    businessUnitId: uuid('business_unit_id').notNull().default(sql.raw("current_setting('app.bu_id')::uuid")),
    stockAdjustmentId: uuid('stock_adjustment_id')
      .notNull()
      .references(() => stockAdjustments.id, { onDelete: 'cascade' }),
    lotNumber: varchar('lot_number', { length: 100 }).notNull(),
    manufacturingDate: timestamp('manufacturing_date', { withTimezone: true, mode: 'string' }),
    expiryDate: timestamp('expiry_date', { withTimezone: true, mode: 'string' }),
    resolvedLotId: uuid('resolved_lot_id').references(() => inventoryItemLots.id, { onDelete: 'set null' }),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_stock_adjustment_lots_adj_lot').on(table.stockAdjustmentId, table.lotNumber),
    index('idx_stock_adjustment_lots_adj').on(table.stockAdjustmentId),
    index('idx_stock_adjustment_lots_resolved').on(table.resolvedLotId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
    pgPolicy('bu_ancestor_read', {
      for: 'select',
      using: sql`business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[])`,
    }),
    pgPolicy('bu_write', {
      for: 'insert',
      withCheck: sql`business_unit_id = (select current_setting('app.bu_id', true)::uuid)`,
    }),
    pgPolicy('bu_update', {
      for: 'update',
      using: sql`business_unit_id = (select current_setting('app.bu_id', true)::uuid)`,
    }),
    pgPolicy('bu_delete', {
      for: 'delete',
      using: sql`business_unit_id = (select current_setting('app.bu_id', true)::uuid)`,
    }),
  ],
);

export type StockAdjustmentLot = typeof stockAdjustmentLots.$inferSelect;
export type NewStockAdjustmentLot = typeof stockAdjustmentLots.$inferInsert;
