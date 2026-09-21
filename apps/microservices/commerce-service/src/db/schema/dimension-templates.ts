import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  boolean,
  check,
  codeCheck,
  index,
  integer,
  pgPolicy,
  timestamp,
  unique,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import {
  organizationIdColumn,
  ownedByWorkspace,
  workspaceHierarchyPolicies,
  workspaceScopeColumns,
} from './workspace-scope';

export const dimensionTemplates = commerceSchema.table(
  'dimension_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
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
    unique('uq_dimension_templates_org_code').on(table.organizationId, table.code),
    codeCheck('dimension_templates_code_chk', table.code),
    unique('uq_dimension_templates_owner_name')
      .on(table.organizationId, table.legalEntityId, table.siteId, table.name)
      .nullsNotDistinct(),
    check('dimension_templates_owner_chk', sql`${table.siteId} is null or ${table.legalEntityId} is not null`),
    index('idx_dimension_templates_org').on(table.organizationId, table.name),
    index('idx_dimension_templates_le').on(table.organizationId, table.legalEntityId),
    index('idx_dimension_templates_site').on(table.organizationId, table.siteId),
    ...workspaceHierarchyPolicies(),
  ],
);

export type DimensionTemplate = typeof dimensionTemplates.$inferSelect;
export type NewDimensionTemplate = typeof dimensionTemplates.$inferInsert;

const TEMPLATE_VISIBLE = sql`exists (select 1 from ${dimensionTemplates} t where t.id = template_id)`;

const TEMPLATE_OWNED = sql`exists (
  select 1 from ${dimensionTemplates} t where t.id = template_id and ${ownedByWorkspace('t')}
)`;

export const dimensionTemplateValues = commerceSchema.table(
  'dimension_template_values',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: organizationIdColumn,
    templateId: uuid('template_id')
      .notNull()
      .references(() => dimensionTemplates.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 50 }).notNull(),
    value: varchar('value', { length: 100 }).notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('uq_dimension_template_values_template_value').on(table.templateId, table.value),
    unique('uq_dimension_template_values_template_code').on(table.templateId, table.code),
    codeCheck('dimension_template_values_code_chk', table.code),
    index('idx_dimension_template_values_template').on(table.templateId, table.sortOrder),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
    pgPolicy('template_reach', { as: 'restrictive', for: 'select', using: TEMPLATE_VISIBLE }),
    pgPolicy('template_owner_insert', { as: 'restrictive', for: 'insert', withCheck: TEMPLATE_OWNED }),
    pgPolicy('template_owner_update', { as: 'restrictive', for: 'update', using: TEMPLATE_OWNED }),
    pgPolicy('template_owner_delete', { as: 'restrictive', for: 'delete', using: TEMPLATE_OWNED }),
  ],
);

export type DimensionTemplateValue = typeof dimensionTemplateValues.$inferSelect;
export type NewDimensionTemplateValue = typeof dimensionTemplateValues.$inferInsert;
