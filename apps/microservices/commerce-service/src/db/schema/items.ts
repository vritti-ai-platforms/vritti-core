import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgPolicy,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { catalogItemTypeEnum } from './enums';

export const items = coreSchema.table(
  'items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("current_setting('app.org_id')::uuid")),
    businessUnitId: uuid('business_unit_id').notNull().default(sql.raw("current_setting('app.bu_id')::uuid")),
    categoryId: uuid('category_id'),
    type: catalogItemTypeEnum('type').notNull(),
    code: varchar('code', { length: 100 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    taxGroupId: uuid('tax_group_id'),
    isAvailable: boolean('is_available').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    attributes: jsonb('attributes').notNull().default({}),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_items_org_code').on(table.organizationId, table.code),
    index('idx_items_bu').on(table.organizationId, table.businessUnitId),
    index('idx_items_category').on(table.categoryId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = current_setting('app.org_id', true)::uuid`,
    }),
    pgPolicy('bu_ancestor_read', {
      for: 'select',
      using: sql`business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[])`,
    }),
    pgPolicy('bu_write', {
      for: 'insert',
      withCheck: sql`business_unit_id = current_setting('app.bu_id', true)::uuid`,
    }),
    pgPolicy('bu_update', {
      for: 'update',
      using: sql`business_unit_id = current_setting('app.bu_id', true)::uuid`,
    }),
    pgPolicy('bu_delete', {
      for: 'delete',
      using: sql`business_unit_id = current_setting('app.bu_id', true)::uuid`,
    }),
  ],
);

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
