import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  boolean,
  check,
  codeCheck,
  index,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { categories } from './categories';
import { commerceSchema } from './commerce-schema';
import { fulfilmentTypeEnum } from './enums';
import { taxClasses } from './tax-classes';
import { organizationIdColumn, workspaceHierarchyPolicies, workspaceScopeColumns } from './workspace-scope';

export const offerings = commerceSchema.table(
  'offerings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: organizationIdColumn,
    ...workspaceScopeColumns,
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    categoryId: uuid('category_id').references(() => categories.id),
    fulfilmentType: fulfilmentTypeEnum('fulfilment_type').notNull(),
    taxClassId: uuid('tax_class_id')
      .notNull()
      .references(() => taxClasses.id),
    isActive: boolean('is_active').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_offerings_org_code').on(table.organizationId, table.code),
    codeCheck('offerings_code_chk', table.code),
    unique('uq_offerings_owner_name')
      .on(table.organizationId, table.legalEntityId, table.siteId, table.name)
      .nullsNotDistinct(),
    check('offerings_owner_chk', sql`${table.siteId} is null or ${table.legalEntityId} is not null`),
    index('idx_offerings_org').on(table.organizationId, table.name),
    index('idx_offerings_le').on(table.organizationId, table.legalEntityId),
    index('idx_offerings_site').on(table.organizationId, table.siteId),
    index('idx_offerings_category').on(table.categoryId),
    ...workspaceHierarchyPolicies(),
  ],
);

export type Offering = typeof offerings.$inferSelect;
export type NewOffering = typeof offerings.$inferInsert;
