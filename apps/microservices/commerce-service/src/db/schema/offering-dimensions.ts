import { codeCheck, index, integer, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { offerings } from './offerings';
import { organizationIdColumn, scopeFromOwnerPolicies } from './workspace-scope';

export const offeringDimensions = commerceSchema.table(
  'offering_dimensions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: organizationIdColumn,
    offeringId: uuid('offering_id')
      .notNull()
      .references(() => offerings.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    description: varchar('description', { length: 500 }),
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
    ...scopeFromOwnerPolicies({ owner: offerings, fk: table.offeringId }),
  ],
);

export type OfferingDimension = typeof offeringDimensions.$inferSelect;
export type NewOfferingDimension = typeof offeringDimensions.$inferInsert;

export const offeringDimensionValues = commerceSchema.table(
  'offering_dimension_values',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: organizationIdColumn,
    dimensionId: uuid('dimension_id')
      .notNull()
      .references(() => offeringDimensions.id, { onDelete: 'cascade' }),
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
    ...scopeFromOwnerPolicies({
      owner: offerings,
      fk: table.dimensionId,
      through: [{ table: offeringDimensions, fk: (parent) => parent.offeringId }],
    }),
  ],
);

export type OfferingDimensionValue = typeof offeringDimensionValues.$inferSelect;
export type NewOfferingDimensionValue = typeof offeringDimensionValues.$inferInsert;
