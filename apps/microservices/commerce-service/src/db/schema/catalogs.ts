import { boolean, index, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { organizationIdColumn, orgIsolationPolicy } from './workspace-scope';

export const catalogs = commerceSchema.table(
  'catalogs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: organizationIdColumn,
    name: varchar('name', { length: 255 }).notNull(),
    ownerLegalEntityId: uuid('owner_legal_entity_id'),
    taxInclusive: boolean('tax_inclusive').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_catalogs_org_name').on(table.organizationId, table.name),
    index('idx_catalogs_org').on(table.organizationId, table.name),
    orgIsolationPolicy(),
  ],
);

export type Catalog = typeof catalogs.$inferSelect;
export type NewCatalog = typeof catalogs.$inferInsert;
