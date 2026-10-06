import { sql } from '@vritti/api-sdk/drizzle-orm';
import { codeCheck, index, integer, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { offerings } from './offerings';
import { organizationIdColumn, scopeFromOwnerPolicies } from './workspace-scope';

export const offeringAttributes = commerceSchema.table(
  'offering_attributes',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
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
    unique('uq_offering_attributes_offering_code').on(table.offeringId, table.code),
    unique('uq_offering_attributes_offering_name').on(table.offeringId, table.name),
    codeCheck('offering_attributes_code_chk', table.code),
    index('idx_offering_attributes_offering').on(table.offeringId, table.sortOrder),
    ...scopeFromOwnerPolicies({ owner: offerings, fk: table.offeringId }),
  ],
);

export type OfferingAttribute = typeof offeringAttributes.$inferSelect;
export type NewOfferingAttribute = typeof offeringAttributes.$inferInsert;

export const offeringAttributeValues = commerceSchema.table(
  'offering_attribute_values',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn,
    attributeId: uuid('attribute_id')
      .notNull()
      .references(() => offeringAttributes.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 50 }).notNull(),
    value: varchar('value', { length: 100 }).notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('uq_offering_attribute_values_attribute_code').on(table.attributeId, table.code),
    unique('uq_offering_attribute_values_attribute_value').on(table.attributeId, table.value),
    codeCheck('offering_attribute_values_code_chk', table.code),
    index('idx_offering_attribute_values_attribute').on(table.attributeId, table.sortOrder),
    ...scopeFromOwnerPolicies({
      owner: offerings,
      fk: table.attributeId,
      through: [{ table: offeringAttributes, fk: (parent) => parent.offeringId }],
    }),
  ],
);

export type OfferingAttributeValue = typeof offeringAttributeValues.$inferSelect;
export type NewOfferingAttributeValue = typeof offeringAttributeValues.$inferInsert;
