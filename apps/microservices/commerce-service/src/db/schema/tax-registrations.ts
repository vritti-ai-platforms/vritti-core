import { sql } from '@vritti/api-sdk/drizzle-orm';
import { boolean, index, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { taxRegistrationTypeEnum } from './enums';
import { taxJurisdictions } from './tax-jurisdictions';
import { organizationIdColumn, orgIsolationPolicy } from './workspace-scope';

export const taxRegistrations = commerceSchema.table(
  'tax_registrations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: organizationIdColumn,
    legalEntityId: uuid('legal_entity_id').notNull().default(sql.raw("cast(current_setting('app.le_id') as uuid)")),
    jurisdictionId: uuid('jurisdiction_id')
      .notNull()
      .references(() => taxJurisdictions.id),
    registrationNumber: varchar('registration_number', { length: 50 }).notNull(),
    registrationType: taxRegistrationTypeEnum('registration_type').notNull(),
    isPrimary: boolean('is_primary').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_tax_registrations_le_juris').on(table.legalEntityId, table.jurisdictionId),
    unique('uq_tax_registrations_org_number').on(table.organizationId, table.registrationNumber),
    index('idx_tax_registrations_le').on(table.legalEntityId),
    orgIsolationPolicy(),
  ],
);

export type TaxRegistration = typeof taxRegistrations.$inferSelect;
export type NewTaxRegistration = typeof taxRegistrations.$inferInsert;
