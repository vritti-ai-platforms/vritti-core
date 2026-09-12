import { sql } from '@vritti/api-sdk/drizzle-orm';
import { codeCheck, index, integer, pgPolicy, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { offeringReachPolicies, offerings } from './offerings';

export const offeringDimensions = commerceSchema.table(
  'offering_dimensions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    offeringId: uuid('offering_id')
      .notNull()
      .references(() => offerings.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    description: varchar('description', { length: 500 }),
    // Drives the order of segments in a variant's derived SKU at the moment that SKU is built. Freely
    // reorderable: stored SKUs are never rewritten, so a change only affects variants created after it.
    sortOrder: integer('sort_order').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_offering_dimensions_offering_code').on(table.offeringId, table.code),
    unique('uq_offering_dimensions_offering_name').on(table.offeringId, table.name),
    codeCheck('offering_dimensions_code_chk', table.code),
    index('idx_offering_dimensions_offering').on(table.offeringId, table.sortOrder),
    ...offeringReachPolicies('offering_id'),
  ],
);

export type OfferingDimension = typeof offeringDimensions.$inferSelect;
export type NewOfferingDimension = typeof offeringDimensions.$inferInsert;

export const offeringDimensionValues = commerceSchema.table(
  'offering_dimension_values',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    dimensionId: uuid('dimension_id')
      .notNull()
      .references(() => offeringDimensions.id, { onDelete: 'cascade' }),
    // One segment of a variant's SKU. Unique per dimension, which with the unique code per offering
    // is what makes the derived SKU unique by construction.
    code: varchar('code', { length: 50 }).notNull(),
    value: varchar('value', { length: 100 }).notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('uq_offering_dimension_values_dimension_code').on(table.dimensionId, table.code),
    unique('uq_offering_dimension_values_dimension_value').on(table.dimensionId, table.value),
    codeCheck('offering_dimension_values_code_chk', table.code),
    index('idx_offering_dimension_values_dimension').on(table.dimensionId, table.sortOrder),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
    // Chains one level further than a direct child: values → dimensions → offerings. RLS applies
    // inside each subquery, so reach still cascades from the offering.
    pgPolicy('offering_reach', {
      as: 'restrictive',
      for: 'all',
      using: sql.raw('exists (select 1 from commerce.offering_dimensions d where d.id = dimension_id)'),
    }),
  ],
);

export type OfferingDimensionValue = typeof offeringDimensionValues.$inferSelect;
export type NewOfferingDimensionValue = typeof offeringDimensionValues.$inferInsert;
