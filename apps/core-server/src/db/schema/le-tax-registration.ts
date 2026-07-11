import { sql } from '@vritti/api-sdk/drizzle-orm';
import { boolean, index, pgPolicy, timestamp, uniqueIndex, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { legalEntities } from './legal-entity';
import { organizations } from './organizations';

export const leTaxRegistrations = coreSchema.table(
  'le_tax_registrations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    legalEntityId: uuid('legal_entity_id')
      .notNull()
      .references(() => legalEntities.id, { onDelete: 'cascade' }),
    taxNumber: varchar('tax_number', { length: 50 }).notNull(),
    region: varchar('region', { length: 100 }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('le_tax_registrations_organization_id_idx').on(table.organizationId),
    index('le_tax_registrations_legal_entity_id_idx').on(table.legalEntityId),
    uniqueIndex('le_tax_registrations_le_tax_number_unique').on(table.legalEntityId, table.taxNumber),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid)`,
    }),
  ],
);

export type LeTaxRegistration = typeof leTaxRegistrations.$inferSelect;
export type NewLeTaxRegistration = typeof leTaxRegistrations.$inferInsert;
