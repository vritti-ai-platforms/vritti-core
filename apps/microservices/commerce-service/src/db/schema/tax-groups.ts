import { sql } from '@vritti/api-sdk/drizzle-orm';
import { boolean, pgPolicy, timestamp, uniqueIndex, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';

export const taxGroups = coreSchema.table(
  'tax_groups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    legalEntityId: uuid('legal_entity_id')
      .notNull()
      .default(sql.raw("cast(current_setting('app.le_id') as uuid)")),
    name: varchar('name', { length: 100 }).notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('tax_groups_le_name_unique').on(table.legalEntityId, table.name),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
    pgPolicy('le_read', {
      for: 'select',
      using: sql`legal_entity_id = (select current_setting('app.le_id', true)::uuid)`,
    }),
    pgPolicy('le_write', {
      for: 'insert',
      withCheck: sql`legal_entity_id = (select current_setting('app.le_id', true)::uuid)`,
    }),
    pgPolicy('le_update', {
      for: 'update',
      using: sql`legal_entity_id = (select current_setting('app.le_id', true)::uuid)`,
    }),
    pgPolicy('le_delete', {
      for: 'delete',
      using: sql`legal_entity_id = (select current_setting('app.le_id', true)::uuid)`,
    }),
  ],
);

export type TaxGroup = typeof taxGroups.$inferSelect;
export type NewTaxGroup = typeof taxGroups.$inferInsert;
