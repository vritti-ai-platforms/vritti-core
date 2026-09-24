import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  boolean,
  customType,
  index,
  integer,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { CategoryRoleValues, categoryRoleEnum } from './enums';
import { taxClasses } from './tax-classes';
import { organizationIdColumn, orgIsolationPolicy } from './workspace-scope';

const ltreeType = customType<{ data: string }>({
  dataType() {
    return 'commerce.ltree';
  },
});

export const categories = commerceSchema.table(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: organizationIdColumn,
    name: varchar('name', { length: 255 }).notNull(),
    image: varchar('image', { length: 255 }),
    parentId: uuid('parent_id'),
    categoryRole: categoryRoleEnum('category_role').notNull().default(CategoryRoleValues.CATEGORY),
    pathLabel: varchar('path_label', { length: 255 }).notNull(),
    path: ltreeType('path').notNull(),
    pathBreadcrumb: text('path_breadcrumb').generatedAlwaysAs(sql`commerce.format_ltree_path(path)`),
    isActive: boolean('is_active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
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
    orgIsolationPolicy(),
  ],
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
