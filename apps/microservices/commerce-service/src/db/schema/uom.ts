import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  pgPolicy,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { uomDimensions } from './uom-dimensions';

export const uom = commerceSchema.table(
  'uom',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    dimensionId: uuid('dimension_id')
      .notNull()
      .references(() => uomDimensions.id, { onDelete: 'restrict' }),
    name: varchar('name', { length: 50 }).notNull(),
    symbol: varchar('symbol', { length: 10 }).notNull(),
    baseUnitId: uuid('base_unit_id'),
    // Integer pair expressing the global conversion ratio for this UOM.
    // Semantic: `uom_qty` units of THIS UOM equal `base_uom_qty` units of the dimension's BASE UOM.
    // Examples: 1 Box = 12 Each → base_uom_qty=12, uom_qty=1.
    //           1 Gram = 0.001 Kg → base_uom_qty=1, uom_qty=1000.
    // The two conversion factors (toBase = base_uom_qty / uom_qty; toUom = uom_qty / base_uom_qty)
    // are computed in the service layer; they are NOT stored.
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
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
  ],
);

export type Uom = typeof uom.$inferSelect;
export type NewUom = typeof uom.$inferInsert;
