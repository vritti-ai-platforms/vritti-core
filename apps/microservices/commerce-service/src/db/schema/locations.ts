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
import { commerceSchema } from './commerce-schema';
import { LocationRoleValues, locationRoleEnum } from './enums';

const ltreeType = customType<{ data: string }>({
  dataType() {
    return 'commerce.ltree';
  },
});

export const locations = commerceSchema.table(
  'locations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    siteId: uuid('site_id').notNull().default(sql.raw("cast(current_setting('app.site_id') as uuid)")),
    name: varchar('name', { length: 100 }).notNull(),
    code: varchar('code', { length: 50 }).notNull(),
    parentId: uuid('parent_id'),
    path: ltreeType('path').notNull(),
    // Human-readable breadcrumb of the ltree path: "main.sales.rack_a" → "Main › Sales › Rack A"
    pathBreadcrumb: text('path_breadcrumb').generatedAlwaysAs(sql`commerce.format_ltree_path(path)`),
    sortOrder: integer('sort_order').notNull().default(1),
    area: varchar('area', { length: 100 }),
    managerId: uuid('manager_id'),
    locationRole: locationRoleEnum('location_role').notNull().default(LocationRoleValues.STORAGE),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_locations_bu_parent_code').on(table.siteId, table.parentId, table.code),
    index('idx_locations_site').on(table.organizationId, table.siteId),
    index('idx_locations_parent').on(table.parentId),
    index('idx_locations_path').using('gist', table.path.asc()),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
    pgPolicy('site_read', {
      for: 'select',
      using: sql`site_id = (select current_setting('app.site_id', true)::uuid)`,
    }),
    pgPolicy('site_write', {
      for: 'insert',
      withCheck: sql`site_id = (select current_setting('app.site_id', true)::uuid)`,
    }),
    pgPolicy('site_update', {
      for: 'update',
      using: sql`site_id = (select current_setting('app.site_id', true)::uuid)`,
    }),
    pgPolicy('site_delete', {
      for: 'delete',
      using: sql`site_id = (select current_setting('app.site_id', true)::uuid)`,
    }),
  ],
);

export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;
