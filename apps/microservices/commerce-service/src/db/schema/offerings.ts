import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  boolean,
  check,
  codeCheck,
  index,
  pgPolicy,
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
import {
  organizationIdColumn,
  ownedByWorkspace,
  ownerMatchesWorkspaceSql,
  workspaceHierarchyPolicies,
  workspaceScopeColumns,
} from './workspace-scope';

export const offeringOwnedByWorkspace = () => ownedByWorkspace();

export const offeringScopePolicies = (fkColumn: string, through?: string) => {
  const from = through ? `commerce.${through} p` : 'commerce.offerings o';
  const match = through ? `p.id = ${fkColumn}` : `o.id = ${fkColumn}`;
  const joinOffering = through ? ' join commerce.offerings o on o.id = p.offering_id' : '';

  const reachable = sql.raw(`exists (select 1 from ${from} where ${match})`);
  const owned = sql.raw(
    `exists (select 1 from ${from}${joinOffering} where ${match} and ${ownerMatchesWorkspaceSql('o')})`,
  );

  return [
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
    pgPolicy('offering_reach', { as: 'restrictive', for: 'select', using: reachable }),
    pgPolicy('offering_owner_insert', { as: 'restrictive', for: 'insert', withCheck: owned }),
    pgPolicy('offering_owner_update', { as: 'restrictive', for: 'update', using: owned }),
    pgPolicy('offering_owner_delete', { as: 'restrictive', for: 'delete', using: owned }),
  ];
};

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
