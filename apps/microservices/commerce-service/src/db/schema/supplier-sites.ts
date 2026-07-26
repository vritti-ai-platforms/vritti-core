import { sql } from '@vritti/api-sdk/drizzle-orm';
import { boolean, foreignKey, index, pgPolicy, timestamp, unique, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { partyBankAccounts, partyRelationships, partyTaxRegistrations } from './parties';
import { suppliers } from './suppliers';

export const supplierSites = commerceSchema.table(
  'supplier_sites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    legalEntityId: uuid('legal_entity_id').notNull().default(sql.raw("cast(current_setting('app.le_id') as uuid)")),
    supplierId: uuid('supplier_id')
      .notNull()
      .references(() => suppliers.id, { onDelete: 'cascade' }),
    // Explicit (no GUC default): the LE workspace enrolls any of its sites; site self-enroll passes its own id.
    siteId: uuid('site_id').notNull(),
    // Origin registration (GSTIN) supplying this site — drives INTRA/INTER tax resolution. Null = warning badge.
    partyTaxRegistrationId: uuid('party_tax_registration_id'),
    // Branch payee; null falls back to the party's primary bank account.
    partyBankAccountId: uuid('party_bank_account_id'),
    // Ordering desk (party_relationships, purpose ORDER) for this site; null falls back to the supplier default.
    orderRelationshipId: uuid('order_relationship_id'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_supplier_sites').on(table.supplierId, table.siteId),
    index('idx_supplier_sites_supplier').on(table.supplierId),
    index('idx_supplier_sites_site').on(table.siteId),
    foreignKey({
      columns: [table.partyTaxRegistrationId],
      foreignColumns: [partyTaxRegistrations.id],
      name: 'fk_supplier_sites_tax_registration',
    }).onDelete('set null'),
    foreignKey({
      columns: [table.partyBankAccountId],
      foreignColumns: [partyBankAccounts.id],
      name: 'fk_supplier_sites_bank_account',
    }).onDelete('set null'),
    foreignKey({
      columns: [table.orderRelationshipId],
      foreignColumns: [partyRelationships.id],
      name: 'fk_supplier_sites_order_relationship',
    }).onDelete('set null'),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
    pgPolicy('le_read', {
      for: 'select',
      using: sql`legal_entity_id = (select current_setting('app.le_id', true)::uuid)`,
    }),
    pgPolicy('le_write', {
      for: 'insert',
      withCheck: sql`legal_entity_id = (select current_setting('app.le_id', true)::uuid)`,
    }),
    pgPolicy('le_update', {
      for: 'update',
      using: sql`legal_entity_id = (select current_setting('app.le_id', true)::uuid)`,
    }),
    pgPolicy('le_delete', {
      for: 'delete',
      using: sql`legal_entity_id = (select current_setting('app.le_id', true)::uuid)`,
    }),
    pgPolicy('site_read', {
      for: 'select',
      using: sql`site_id = (select current_setting('app.site_id', true)::uuid)`,
    }),
    pgPolicy('site_write', {
      for: 'insert',
      withCheck: sql`site_id = (select current_setting('app.site_id', true)::uuid)`,
    }),
    pgPolicy('site_update', {
      for: 'update',
      using: sql`site_id = (select current_setting('app.site_id', true)::uuid)`,
    }),
    pgPolicy('site_delete', {
      for: 'delete',
      using: sql`site_id = (select current_setting('app.site_id', true)::uuid)`,
    }),
  ],
);

export type SupplierSite = typeof supplierSites.$inferSelect;
export type NewSupplierSite = typeof supplierSites.$inferInsert;
