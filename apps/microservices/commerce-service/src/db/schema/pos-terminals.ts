import { sql } from '@vritti/api-sdk/drizzle-orm';
import { boolean, index, pgPolicy, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { storageLocations } from './storage-locations';

export const posTerminals = coreSchema.table(
  'pos_terminals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql`current_setting('app.org_id')::uuid`),
    businessUnitId: uuid('business_unit_id').notNull().default(sql`current_setting('app.bu_id')::uuid`),
    name: varchar('name', { length: 100 }).notNull(),
    code: varchar('code', { length: 50 }).notNull(),
    storageLocationId: uuid('storage_location_id')
      .notNull()
      .references(() => storageLocations.id, { onDelete: 'restrict' }),
    description: varchar('description', { length: 500 }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_pos_terminals_bu_code').on(table.businessUnitId, table.code),
    index('idx_pos_terminals_bu').on(table.organizationId, table.businessUnitId),
    index('idx_pos_terminals_location').on(table.storageLocationId),
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

export type PosTerminal = typeof posTerminals.$inferSelect;
export type NewPosTerminal = typeof posTerminals.$inferInsert;
