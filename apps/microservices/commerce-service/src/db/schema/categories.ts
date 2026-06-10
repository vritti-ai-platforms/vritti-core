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
import { taxGroups } from './tax-groups';

const ltreeType = customType<{ data: string }>({
  dataType() {
    return 'vritti_core.ltree';
  },
});

export const categories = coreSchema.table(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    businessUnitId: uuid('business_unit_id').notNull().default(sql.raw("cast(current_setting('app.bu_id') as uuid)")),
    name: varchar('name', { length: 255 }).notNull(),
    image: varchar('image', { length: 255 }),
    parentId: uuid('parent_id'),
    pathLabel: varchar('path_label', { length: 255 }).notNull(),
    path: ltreeType('path').notNull(),
    // Human-readable breadcrumb of the ltree path; computed at DB level via format_ltree_path.
    pathBreadcrumb: text('path_breadcrumb').generatedAlwaysAs(sql`vritti_core.format_ltree_path(path)`),
    isActive: boolean('is_active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    // Default tax group applied to items created under this category (sale + purchase suggestion).
    defaultTaxGroupId: uuid('default_tax_group_id').references(() => taxGroups.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_categories_parent_path_label').on(table.parentId, table.pathLabel),
    index('idx_categories_bu').on(table.organizationId, table.businessUnitId),
    index('idx_categories_parent').on(table.parentId),
    index('idx_categories_path').using('gist', table.path.asc()),
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

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
