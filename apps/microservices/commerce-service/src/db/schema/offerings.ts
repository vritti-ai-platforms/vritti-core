import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  boolean,
  check,
  codeCheck,
  index,
  integer,
  jsonb,
  pgPolicy,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { fulfilmentTypeEnum } from './enums';
import { taxClasses } from './tax-classes';

const LE_GUC = "cast(nullif(current_setting('app.le_id', true), '') as uuid)";
const SITE_GUC = "cast(nullif(current_setting('app.site_id', true), '') as uuid)";

const OWNER_MATCHES_WORKSPACE_SQL = `
  case
    when ${SITE_GUC} is not null then site_id = ${SITE_GUC} and legal_entity_id = ${LE_GUC}
    when ${LE_GUC} is not null then legal_entity_id = ${LE_GUC} and site_id is null
    else legal_entity_id is null and site_id is null
  end`;

const OWNER_MATCHES_WORKSPACE = sql.raw(OWNER_MATCHES_WORKSPACE_SQL);

export const offeringOwnedByWorkspace = () => sql<boolean>`coalesce(${sql.raw(OWNER_MATCHES_WORKSPACE_SQL)}, false)`;

// A child of an offering is reachable exactly when the offering is — RLS on offerings applies inside
// this subquery, so reach cascades without repeating the five branches on every child table.
export const offeringReachPolicies = (fkColumn: string) => [
  pgPolicy('org_isolation', {
    for: 'all',
    using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
  }),
  pgPolicy('offering_reach', {
    as: 'restrictive',
    for: 'all',
    using: sql.raw(`exists (select 1 from commerce.offerings o where o.id = ${fkColumn})`),
  }),
];

export const offerings = commerceSchema.table(
  'offerings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    legalEntityId: uuid('legal_entity_id').default(sql.raw(LE_GUC)),
    siteId: uuid('site_id').default(sql.raw(SITE_GUC)),
    // Unique per ORGANIZATION, not per owner — the SKU embeds it, so two owners minting the same code
    // would produce colliding SKUs. A sibling's clashing code is invisible to reach, so the database
    // is the arbiter and the service turns 23505 into a conflict.
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    categoryId: uuid('category_id'),
    fulfilmentType: fulfilmentTypeEnum('fulfilment_type').notNull(),
    // What this product IS for tax purposes. Required and stored here — there is no inheritance
    // chain; a category's default only prefills the form. The RATE is never stored on a product:
    // it resolves at transaction time from class x origin x destination x date.
    taxClassId: uuid('tax_class_id')
      .notNull()
      .references(() => taxClasses.id),
    // An offering is only sellable once it has a variant, so it starts off and is switched on explicitly
    isActive: boolean('is_active').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    attributes: jsonb('attributes').notNull().default({}),
    metadata: jsonb('metadata').notNull().default({}),
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
    // ORG = both null · LE = le only · SITE = both, because every site belongs to exactly one LE
    check('offerings_owner_chk', sql`${table.siteId} is null or ${table.legalEntityId} is not null`),
    index('idx_offerings_org').on(table.organizationId, table.name),
    index('idx_offerings_le').on(table.organizationId, table.legalEntityId),
    index('idx_offerings_site').on(table.organizationId, table.siteId),
    index('idx_offerings_category').on(table.categoryId),
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

export type Offering = typeof offerings.$inferSelect;
export type NewOffering = typeof offerings.$inferInsert;
