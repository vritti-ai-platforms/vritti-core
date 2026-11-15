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
import { LocationRoleValues, locationRoleEnum } from './enums';
import { storageTypes } from './storage-types';
import { organizationIdColumn, siteDocumentColumns, siteDocumentPolicies } from './workspace-scope';

const ltreeType = customType<{ data: string }>({
  dataType() {
    return 'commerce.ltree';
  },
});

export const locations = commerceSchema.table(
  'locations',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn(),
    ...siteDocumentColumns(),
    name: varchar('name', { length: 100 }).notNull(),
    code: varchar('code', { length: 50 }).notNull(),
    parentId: uuid('parent_id'),
    path: ltreeType('path').notNull(),
    pathBreadcrumb: text('path_breadcrumb').generatedAlwaysAs(sql`commerce.format_ltree_path(path)`),
    sortOrder: integer('sort_order').notNull().default(1),
    area: varchar('area', { length: 100 }),
    managerId: uuid('manager_id'),
    locationRole: locationRoleEnum('location_role').notNull().default(LocationRoleValues.STORAGE),
    storageTypeId: uuid('storage_type_id').references(() => storageTypes.id, { onDelete: 'restrict' }),
    isStorageTypeOverridden: boolean('is_storage_type_overridden').notNull().default(false),
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
    index('idx_locations_storage_type').on(table.storageTypeId),
    ...siteDocumentPolicies(),
  ],
);

export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;
