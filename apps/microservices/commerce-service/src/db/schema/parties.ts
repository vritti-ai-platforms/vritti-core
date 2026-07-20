import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  boolean,
  date,
  index,
  pgPolicy,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import {
  partyAddressTypeEnum,
  partyContactPurposeEnum,
  partyIdentifierTypeEnum,
  partyLicenseTypeEnum,
  partyTypeEnum,
  taxRegistrationTypeEnum,
} from './enums';
import { taxJurisdictions } from './tax-jurisdictions';

export const parties = coreSchema.table(
  'parties',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    partyType: partyTypeEnum('party_type').notNull(),
    displayName: varchar('display_name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 20 }),
    isActive: boolean('is_active').notNull().default(true),
    legalName: varchar('legal_name', { length: 255 }),
    jurisdictionId: uuid('jurisdiction_id').references(() => taxJurisdictions.id),
    website: varchar('website', { length: 255 }),
    firstName: varchar('first_name', { length: 120 }),
    lastName: varchar('last_name', { length: 120 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_parties_org').on(table.organizationId),
    index('idx_parties_type').on(table.partyType),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
  ],
);

export type Party = typeof parties.$inferSelect;
export type NewParty = typeof parties.$inferInsert;

export const partyAddresses = coreSchema.table(
  'party_addresses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    partyId: uuid('party_id')
      .notNull()
      .references(() => parties.id, { onDelete: 'cascade' }),
    type: partyAddressTypeEnum('type').notNull(),
    line1: varchar('line1', { length: 255 }).notNull(),
    line2: varchar('line2', { length: 255 }),
    city: varchar('city', { length: 120 }),
    region: varchar('region', { length: 120 }),
    postalCode: varchar('postal_code', { length: 20 }),
    countryCode: varchar('country_code', { length: 2 }).notNull(),
    isPrimary: boolean('is_primary').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_party_addresses_party').on(table.partyId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
  ],
);

export type PartyAddress = typeof partyAddresses.$inferSelect;
export type NewPartyAddress = typeof partyAddresses.$inferInsert;

export const partyIdentifiers = coreSchema.table(
  'party_identifiers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    partyId: uuid('party_id')
      .notNull()
      .references(() => parties.id, { onDelete: 'cascade' }),
    idType: partyIdentifierTypeEnum('id_type').notNull(),
    idValue: varchar('id_value', { length: 100 }).notNull(),
    isPrimary: boolean('is_primary').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_party_identifiers_org_type_value').on(table.organizationId, table.idType, table.idValue),
    index('idx_party_identifiers_party').on(table.partyId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
  ],
);

export type PartyIdentifier = typeof partyIdentifiers.$inferSelect;
export type NewPartyIdentifier = typeof partyIdentifiers.$inferInsert;

export const partyRelationships = coreSchema.table(
  'party_relationships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    parentPartyId: uuid('parent_party_id')
      .notNull()
      .references(() => parties.id, { onDelete: 'cascade' }),
    childPartyId: uuid('child_party_id')
      .notNull()
      .references(() => parties.id, { onDelete: 'cascade' }),
    jobTitle: varchar('job_title', { length: 100 }),
    secondaryPhone: varchar('secondary_phone', { length: 20 }),
    secondaryEmail: varchar('secondary_email', { length: 255 }),
    isPrimary: boolean('is_primary').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_party_rel_parent_child').on(table.parentPartyId, table.childPartyId),
    index('idx_party_rel_parent').on(table.parentPartyId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
  ],
);

export type PartyRelationship = typeof partyRelationships.$inferSelect;
export type NewPartyRelationship = typeof partyRelationships.$inferInsert;

export const partyTaxRegistrations = coreSchema.table(
  'party_tax_registrations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    partyId: uuid('party_id')
      .notNull()
      .references(() => parties.id, { onDelete: 'cascade' }),
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
    unique('uq_party_tax_reg_party_juris').on(table.partyId, table.jurisdictionId),
    unique('uq_party_tax_reg_org_number').on(table.organizationId, table.registrationNumber),
    index('idx_party_tax_reg_party').on(table.partyId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
  ],
);

export type PartyTaxRegistration = typeof partyTaxRegistrations.$inferSelect;
export type NewPartyTaxRegistration = typeof partyTaxRegistrations.$inferInsert;

export const partyLicenses = coreSchema.table(
  'party_licenses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    partyId: uuid('party_id')
      .notNull()
      .references(() => parties.id, { onDelete: 'cascade' }),
    licenseType: partyLicenseTypeEnum('license_type').notNull(),
    licenseNumber: varchar('license_number', { length: 100 }).notNull(),
    region: varchar('region', { length: 120 }),
    validTo: date('valid_to', { mode: 'string' }),
    notes: varchar('notes', { length: 500 }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_party_licenses_org_type_number').on(table.organizationId, table.licenseType, table.licenseNumber),
    index('idx_party_licenses_party').on(table.partyId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
  ],
);

export type PartyLicense = typeof partyLicenses.$inferSelect;
export type NewPartyLicense = typeof partyLicenses.$inferInsert;

export const partyBankAccounts = coreSchema.table(
  'party_bank_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    partyId: uuid('party_id')
      .notNull()
      .references(() => parties.id, { onDelete: 'cascade' }),
    accountName: varchar('account_name', { length: 255 }).notNull(),
    accountNumber: varchar('account_number', { length: 50 }).notNull(),
    ifscCode: varchar('ifsc_code', { length: 20 }),
    upiId: varchar('upi_id', { length: 100 }),
    bankName: varchar('bank_name', { length: 255 }),
    isPrimary: boolean('is_primary').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_party_bank_accounts_party_number').on(table.partyId, table.accountNumber),
    uniqueIndex('uq_party_bank_accounts_primary').on(table.partyId).where(sql`is_primary = true`),
    index('idx_party_bank_accounts_party').on(table.partyId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
  ],
);

export type PartyBankAccount = typeof partyBankAccounts.$inferSelect;
export type NewPartyBankAccount = typeof partyBankAccounts.$inferInsert;

export const partyContacts = coreSchema.table(
  'party_contacts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    partyId: uuid('party_id')
      .notNull()
      .references(() => parties.id, { onDelete: 'cascade' }),
    purpose: partyContactPurposeEnum('purpose').notNull(),
    label: varchar('label', { length: 120 }),
    name: varchar('name', { length: 150 }),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 20 }),
    isPrimary: boolean('is_primary').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('uq_party_contacts_primary').on(table.partyId, table.purpose).where(sql`is_primary = true`),
    index('idx_party_contacts_party').on(table.partyId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
  ],
);

export type PartyContact = typeof partyContacts.$inferSelect;
export type NewPartyContact = typeof partyContacts.$inferInsert;
