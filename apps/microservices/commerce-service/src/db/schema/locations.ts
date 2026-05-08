import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  boolean,
  customType,
  index,
  integer,
  pgPolicy,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { LocationRoleValues, locationRoleEnum } from './enums';

const ltreeType = customType<{ data: string }>({
  dataType() {
    return 'vritti_core.ltree';
  },
});

export const locations = coreSchema.table(
  'locations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("current_setting('app.org_id')::uuid")),
    businessUnitId: uuid('business_unit_id').notNull().default(sql.raw("current_setting('app.bu_id')::uuid")),
    name: varchar('name', { length: 100 }).notNull(),
    code: varchar('code', { length: 50 }).notNull(),
    parentId: uuid('parent_id'),
    path: ltreeType('path').notNull(),
    sortOrder: integer('sort_order').notNull().default(1),
    area: varchar('area', { length: 100 }),
    managerId: uuid('manager_id'),
    address: text('address'),
    locationRole: locationRoleEnum('location_role').notNull().default(LocationRoleValues.STORAGE),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_locations_bu_code').on(table.businessUnitId, table.code),
    index('idx_locations_bu').on(table.organizationId, table.businessUnitId),
    index('idx_locations_parent').on(table.parentId),
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

export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;
