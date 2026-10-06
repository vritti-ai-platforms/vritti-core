import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  boolean,
  check,
  codeCheck,
  index,
  integer,
  timestamp,
  unique,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import {
  organizationIdColumn,
  scopeFromOwnerPolicies,
  workspaceHierarchyPolicies,
  workspaceScopeColumns,
} from './workspace-scope';

export const attributeTemplates = commerceSchema.table(
  'attribute_templates',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn,
    ...workspaceScopeColumns,
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    description: varchar('description', { length: 500 }),
    isActive: boolean('is_active').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_attribute_templates_org_code').on(table.organizationId, table.code),
    codeCheck('attribute_templates_code_chk', table.code),
    unique('uq_attribute_templates_owner_name')
      .on(table.organizationId, table.legalEntityId, table.siteId, table.name)
      .nullsNotDistinct(),
    check('attribute_templates_owner_chk', sql`${table.siteId} is null or ${table.legalEntityId} is not null`),
    index('idx_attribute_templates_org').on(table.organizationId, table.name),
    index('idx_attribute_templates_le').on(table.organizationId, table.legalEntityId),
    index('idx_attribute_templates_site').on(table.organizationId, table.siteId),
    ...workspaceHierarchyPolicies(),
  ],
);

export type AttributeTemplate = typeof attributeTemplates.$inferSelect;
export type NewAttributeTemplate = typeof attributeTemplates.$inferInsert;

export const attributeTemplateValues = commerceSchema.table(
  'attribute_template_values',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn,
    templateId: uuid('template_id')
      .notNull()
      .references(() => attributeTemplates.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 50 }).notNull(),
    value: varchar('value', { length: 100 }).notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('uq_attribute_template_values_template_value').on(table.templateId, table.value),
    unique('uq_attribute_template_values_template_code').on(table.templateId, table.code),
    codeCheck('attribute_template_values_code_chk', table.code),
    index('idx_attribute_template_values_template').on(table.templateId, table.sortOrder),
    ...scopeFromOwnerPolicies({ owner: attributeTemplates, fk: table.templateId }),
  ],
);

export type AttributeTemplateValue = typeof attributeTemplateValues.$inferSelect;
export type NewAttributeTemplateValue = typeof attributeTemplateValues.$inferInsert;
