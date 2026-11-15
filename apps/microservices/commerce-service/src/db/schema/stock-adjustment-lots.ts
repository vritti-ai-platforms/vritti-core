import { sql } from '@vritti/api-sdk/drizzle-orm';
import { bigint, check, index, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { inventoryItemLots } from './inventory-item-lots';
import { stockAdjustments } from './stock-adjustments';
import { organizationIdColumn, scopeFromOwnerPolicies, siteIdColumn } from './workspace-scope';

export const stockAdjustmentLots = commerceSchema.table(
  'stock_adjustment_lots',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn(),
    siteId: siteIdColumn().notNull(),
    stockAdjustmentId: uuid('stock_adjustment_id')
      .notNull()
      .references(() => stockAdjustments.id, { onDelete: 'cascade' }),
    lotNumber: varchar('lot_number', { length: 100 }).notNull(),
    manufacturingDate: timestamp('manufacturing_date', { withTimezone: true, mode: 'string' }),
    expiryDate: timestamp('expiry_date', { withTimezone: true, mode: 'string' }).notNull(),
    resolvedLotId: uuid('resolved_lot_id').references(() => inventoryItemLots.id, { onDelete: 'set null' }),
    mrp: bigint('mrp', { mode: 'bigint' }),
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
    check(
      'ck_stock_adjustment_lots_expiry_after_mfg',
      sql`${table.manufacturingDate} IS NULL OR ${table.expiryDate} > ${table.manufacturingDate}`,
    ),
    ...scopeFromOwnerPolicies({ owner: stockAdjustments, fk: table.stockAdjustmentId, ownerIs: 'siteDocument' }),
  ],
);

export type StockAdjustmentLot = typeof stockAdjustmentLots.$inferSelect;
export type NewStockAdjustmentLot = typeof stockAdjustmentLots.$inferInsert;
