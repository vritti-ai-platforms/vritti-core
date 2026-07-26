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
import { CategoryRoleValues, categoryRoleEnum } from './enums';
import { taxClasses } from './tax-classes';

const ltreeType = customType<{ data: string }>({
  dataType() {
    return 'commerce.ltree';
  },
});

export const categories = commerceSchema.table(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    name: varchar('name', { length: 255 }).notNull(),
    image: varchar('image', { length: 255 }),
    parentId: uuid('parent_id'),
    // GROUP holds sub-categories; CATEGORY is a leaf that holds inventory items.
    categoryRole: categoryRoleEnum('category_role').notNull().default(CategoryRoleValues.CATEGORY),
    pathLabel: varchar('path_label', { length: 255 }).notNull(),
    path: ltreeType('path').notNull(),
    // Human-readable breadcrumb of the ltree path; computed at DB level via format_ltree_path.
    pathBreadcrumb: text('path_breadcrumb').generatedAlwaysAs(sql`commerce.format_ltree_path(path)`),
    isActive: boolean('is_active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    // Default tax class applied to items created under this leaf category (resolved to rates per LE).
    // Nullable: GROUP categories are organizational and carry no tax class; only leaf CATEGORY rows set it.
    defaultTaxClassId: uuid('default_tax_class_id').references(() => taxClasses.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_categories_parent_path_label').on(table.parentId, table.pathLabel),
    index('idx_categories_org').on(table.organizationId),
    index('idx_categories_parent').on(table.parentId),
    index('idx_categories_path').using('gist', table.path.asc()),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
  ],
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
