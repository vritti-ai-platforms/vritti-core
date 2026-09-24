import { sql } from '@vritti/api-sdk/drizzle-orm';
import { boolean, check, index, integer, timestamp, uniqueIndex, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { uomDimensions } from './uom-dimensions';
import { organizationIdColumn, orgIsolationPolicy } from './workspace-scope';

export const uom = commerceSchema.table(
  'uom',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: organizationIdColumn,
    dimensionId: uuid('dimension_id')
      .notNull()
      .references(() => uomDimensions.id, { onDelete: 'restrict' }),
    name: varchar('name', { length: 50 }).notNull(),
    symbol: varchar('symbol', { length: 10 }).notNull(),
    baseUnitId: uuid('base_unit_id'),
    baseUomQty: integer('base_uom_qty').notNull().default(1),
    uomQty: integer('uom_qty').notNull().default(1),
    allowDecimal: boolean('allow_decimal').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('uq_uom_org_symbol').on(table.organizationId, table.symbol),
    index('idx_uom_org').on(table.organizationId),
    index('idx_uom_dimension').on(table.dimensionId),
    check('chk_uom_base_uom_qty_positive', sql`${table.baseUomQty} > 0`),
    check('chk_uom_uom_qty_positive', sql`${table.uomQty} > 0`),
    orgIsolationPolicy(),
  ],
);

export type Uom = typeof uom.$inferSelect;
export type NewUom = typeof uom.$inferInsert;
