import { sql } from '@vritti/api-sdk/drizzle-orm';
import { boolean, integer, jsonb, pgPolicy, timestamp, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { fieldTypeEnum } from './enums';

export const itemFieldDefinitions = coreSchema.table(
  'item_field_definitions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    businessUnitId: uuid('business_unit_id').notNull().default(sql.raw("cast(current_setting('app.bu_id') as uuid)")),
    name: varchar('name', { length: 100 }).notNull(),
    fieldType: fieldTypeEnum('field_type').notNull(),
    options: jsonb('options').$type<string[]>().notNull().default([]),
    isRequired: boolean('is_required').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (_) => [
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

export type ItemFieldDefinition = typeof itemFieldDefinitions.$inferSelect;
export type NewItemFieldDefinition = typeof itemFieldDefinitions.$inferInsert;
