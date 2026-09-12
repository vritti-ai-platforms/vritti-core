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

const LE_GUC = "cast(nullif(current_setting('app.le_id', true), '') as uuid)";
const SITE_GUC = "cast(nullif(current_setting('app.site_id', true), '') as uuid)";

const OWNER_MATCHES_WORKSPACE_SQL = `
  case
    when ${SITE_GUC} is not null then site_id = ${SITE_GUC} and legal_entity_id = ${LE_GUC}
    when ${LE_GUC} is not null then legal_entity_id = ${LE_GUC} and site_id is null
    else legal_entity_id is null and site_id is null
  end`;

const OWNER_MATCHES_WORKSPACE = sql.raw(OWNER_MATCHES_WORKSPACE_SQL);

export const ownedByWorkspace = () => sql<boolean>`coalesce(${sql.raw(OWNER_MATCHES_WORKSPACE_SQL)}, false)`;

export const offeringDimensionTemplates = commerceSchema.table(
  'offering_dimension_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    legalEntityId: uuid('legal_entity_id').default(sql.raw(LE_GUC)),
    siteId: uuid('site_id').default(sql.raw(SITE_GUC)),
    // Stable identifier, unique per ORGANIZATION so two owners cannot mint the same one — the
    // display name stays free to repeat across scopes. Mirrors uom_dimensions / tax_classes.
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    description: varchar('description', { length: 500 }),
    sortOrder: integer('sort_order').notNull().default(0),
    // A template is only useful once it has values, so it starts off and is switched on explicitly
    isActive: boolean('is_active').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_offering_dimension_templates_org_code').on(table.organizationId, table.code),
    codeCheck('offering_dimension_templates_code_chk', table.code),
    unique('uq_offering_dimension_templates_owner_name')
      .on(table.organizationId, table.legalEntityId, table.siteId, table.name)
      .nullsNotDistinct(),
    // ORG = both null · LE = le only · SITE = both, because every site belongs to exactly one LE
    check('offering_dimension_templates_owner_chk', sql`${table.siteId} is null or ${table.legalEntityId} is not null`),
    index('idx_offering_dimension_templates_org').on(table.organizationId, table.name),
    index('idx_offering_dimension_templates_le').on(table.organizationId, table.legalEntityId),
    index('idx_offering_dimension_templates_site').on(table.organizationId, table.siteId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
    pgPolicy('reach_read', {
      as: 'restrictive',
      for: 'select',
      using: sql.raw(`
        -- upward: org-owned rows are visible from every workspace
        (legal_entity_id is null and site_id is null)
        -- downward: the org workspace sees every row in the organization
        or (${LE_GUC} is null and ${SITE_GUC} is null)
        -- upward: my legal entity's own rows, whether I am that LE or a site beneath it
        or (site_id is null and legal_entity_id = ${LE_GUC})
        -- downward: an LE workspace also sees the rows its sites own
        or (${SITE_GUC} is null and legal_entity_id = ${LE_GUC})
        -- my own site's rows (a sibling site's are never visible)
        or site_id = ${SITE_GUC}`),
    }),
    pgPolicy('owner_insert', { as: 'restrictive', for: 'insert', withCheck: OWNER_MATCHES_WORKSPACE }),
    pgPolicy('owner_update', { as: 'restrictive', for: 'update', using: OWNER_MATCHES_WORKSPACE }),
    pgPolicy('owner_delete', { as: 'restrictive', for: 'delete', using: OWNER_MATCHES_WORKSPACE }),
  ],
);

export type OfferingDimensionTemplate = typeof offeringDimensionTemplates.$inferSelect;
export type NewOfferingDimensionTemplate = typeof offeringDimensionTemplates.$inferInsert;

export const offeringDimensionTemplateValues = commerceSchema.table(
  'offering_dimension_template_values',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    templateId: uuid('template_id')
      .notNull()
      .references(() => offeringDimensionTemplates.id, { onDelete: 'cascade' }),
    // Copied onto an offering dimension value, where it becomes a segment of the derived SKU
    code: varchar('code', { length: 50 }).notNull(),
    value: varchar('value', { length: 100 }).notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('uq_offering_dimension_template_values_template_value').on(table.templateId, table.value),
    unique('uq_offering_dimension_template_values_template_code').on(table.templateId, table.code),
    codeCheck('offering_dimension_template_values_code_chk', table.code),
    index('idx_offering_dimension_template_values_template').on(table.templateId, table.sortOrder),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
  ],
);

export type OfferingDimensionTemplateValue = typeof offeringDimensionTemplateValues.$inferSelect;
export type NewOfferingDimensionTemplateValue = typeof offeringDimensionTemplateValues.$inferInsert;
