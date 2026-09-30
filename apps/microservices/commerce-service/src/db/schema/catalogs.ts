import { sql } from '@vritti/api-sdk/drizzle-orm';
import { boolean, check, index, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { organizationIdColumn, workspaceScopeColumns, workspaceScopePolicies } from './workspace-scope';

export const catalogs = commerceSchema.table(
  'catalogs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: organizationIdColumn,
    legalEntityId: workspaceScopeColumns.legalEntityId,
    siteId: workspaceScopeColumns.siteId,
    name: varchar('name', { length: 255 }).notNull(),
    taxInclusive: boolean('tax_inclusive').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // Scoped, so two legal entities may each own a catalog of the same name
    unique('uq_catalogs_owner_name')
      .on(table.organizationId, table.legalEntityId, table.siteId, table.name)
      .nullsNotDistinct(),
    index('idx_catalogs_org').on(table.organizationId, table.name),
    check('ck_catalogs_site_needs_le', sql`${table.siteId} is null or ${table.legalEntityId} is not null`),
    // Same reach as its listings: a workspace sees catalogs owned by itself or any workspace above it,
    // and may only write its own. A site's catalog is therefore edited from the site workspace, where
    // every item it can reach — org, its LE, its own — is available to add.
    ...workspaceScopePolicies('catalog_reach'),
  ],
);

export type Catalog = typeof catalogs.$inferSelect;
export type NewCatalog = typeof catalogs.$inferInsert;
