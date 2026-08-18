import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  pgPolicy,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import {
  messagingAppEnum,
  partyCommunicationChannelEnum,
  partyFunctionTypeEnum,
  partyIdentifierTypeEnum,
  partyLicenseTypeEnum,
  partyTypeEnum,
  socialPlatformEnum,
  taxRegistrationTypeEnum,
} from './enums';
import { taxJurisdictions } from './tax-jurisdictions';

export const parties = commerceSchema.table(
  'parties',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    partyType: partyTypeEnum('party_type').notNull(),
    displayName: varchar('display_name', { length: 255 }).notNull(),
    isActive: boolean('is_active').notNull().default(true),
    legalName: varchar('legal_name', { length: 255 }),
    jurisdictionId: uuid('jurisdiction_id').references(() => taxJurisdictions.id),
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

export const partyAddresses = commerceSchema.table(
  'party_addresses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    partyId: uuid('party_id')
      .notNull()
      .references(() => parties.id, { onDelete: 'cascade' }),
    line1: varchar('line1', { length: 255 }).notNull(),
    line2: varchar('line2', { length: 255 }),
    city: varchar('city', { length: 120 }),
    region: varchar('region', { length: 120 }),
    postalCode: varchar('postal_code', { length: 20 }),
    countryCode: varchar('country_code', { length: 2 }).notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_party_addresses_party_id').on(table.partyId, table.id),
    index('idx_party_addresses_party').on(table.partyId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
  ],
);

export type PartyAddress = typeof partyAddresses.$inferSelect;
export type NewPartyAddress = typeof partyAddresses.$inferInsert;

export const partyIdentifiers = commerceSchema.table(
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

export const partyRelationships = commerceSchema.table(
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
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_party_rel_parent_child').on(table.parentPartyId, table.childPartyId),
    unique('uq_party_rel_parent_id').on(table.parentPartyId, table.id),
    index('idx_party_rel_parent').on(table.parentPartyId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
  ],
);

export type PartyRelationship = typeof partyRelationships.$inferSelect;
export type NewPartyRelationship = typeof partyRelationships.$inferInsert;

export const partyTaxRegistrations = commerceSchema.table(
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

export const partyLicenses = commerceSchema.table(
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

export const partyBankAccounts = commerceSchema.table(
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

export const partyCommunications = commerceSchema.table(
  'party_communications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    partyId: uuid('party_id')
      .notNull()
      .references(() => parties.id, { onDelete: 'cascade' }),
    channel: partyCommunicationChannelEnum('channel').notNull(),
    value: varchar('value', { length: 255 }).notNull(),
    isPrimary: boolean('is_primary').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('uq_party_communications_primary').on(table.partyId, table.channel).where(sql`is_primary = true`),
    unique('uq_party_communications_party_channel_value').on(table.partyId, table.channel, table.value),
    index('idx_party_communications_party').on(table.partyId),
    // Only a real contact method can be primary. WEB_APP rows carry an external
    // account id, and one person may hold accounts in several web apps — so
    // without this, the second app's insert would collide with the partial unique
    // above. Making it a constraint rather than a convention means no writer has
    // to remember.
    check('party_communications_primary_channel_chk', sql`is_primary = false OR channel IN ('EMAIL', 'PHONE')`),
    // Resolves a party from a presented email or phone at signup. `lower(value)`
    // is what makes the match case-insensitive without a second column.
    index('idx_party_communications_lookup').on(table.organizationId, table.channel, sql`lower(${table.value})`),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
  ],
);

export type PartyCommunication = typeof partyCommunications.$inferSelect;
export type NewPartyCommunication = typeof partyCommunications.$inferInsert;

// Messaging apps reachable on a PHONE communication (WhatsApp/Telegram/… ride on the number)
export const partyCommunicationApps = commerceSchema.table(
  'party_communication_apps',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    communicationId: uuid('communication_id')
      .notNull()
      .references(() => partyCommunications.id, { onDelete: 'cascade' }),
    app: messagingAppEnum('app').notNull(),
    handle: varchar('handle', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_party_communication_apps_comm_app').on(table.communicationId, table.app),
    index('idx_party_communication_apps_comm').on(table.communicationId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
  ],
);

export type PartyCommunicationApp = typeof partyCommunicationApps.$inferSelect;
export type NewPartyCommunicationApp = typeof partyCommunicationApps.$inferInsert;

// Social / web presence profiles of a party (Instagram, Facebook, LinkedIn, …) — handle/URL, no primary
export const partySocialProfiles = commerceSchema.table(
  'party_social_profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    partyId: uuid('party_id')
      .notNull()
      .references(() => parties.id, { onDelete: 'cascade' }),
    platform: socialPlatformEnum('platform').notNull(),
    url: varchar('url', { length: 500 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_party_social_profiles_party').on(table.partyId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
  ],
);

export type PartySocialProfile = typeof partySocialProfiles.$inferSelect;
export type NewPartySocialProfile = typeof partySocialProfiles.$inferInsert;

export const partyFunctions = commerceSchema.table(
  'party_functions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    partyId: uuid('party_id')
      .notNull()
      .references(() => parties.id, { onDelete: 'cascade' }),
    function: partyFunctionTypeEnum('function').notNull(),
    partyAddressId: uuid('party_address_id'),
    partyRelationshipId: uuid('party_relationship_id'),
    isPrimary: boolean('is_primary').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    check(
      'party_functions_target_chk',
      sql`("function" IN ('REGISTERED','BILLING','SHIPPING','ORDERING') AND party_address_id IS NOT NULL AND party_relationship_id IS NULL) OR ("function" IN ('ORDER','ACCOUNTS','LOGISTICS','ESCALATION') AND party_relationship_id IS NOT NULL AND party_address_id IS NULL)`,
    ),
    foreignKey({
      columns: [table.partyId, table.partyAddressId],
      foreignColumns: [partyAddresses.partyId, partyAddresses.id],
      name: 'fk_party_functions_address',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.partyId, table.partyRelationshipId],
      foreignColumns: [partyRelationships.parentPartyId, partyRelationships.id],
      name: 'fk_party_functions_relationship',
    }).onDelete('cascade'),
    uniqueIndex('uq_party_functions_primary').on(table.partyId, table.function).where(sql`is_primary = true`),
    unique('uq_party_functions_relationship_function').on(table.partyRelationshipId, table.function),
    unique('uq_party_functions_address_function').on(table.partyAddressId, table.function),
    index('idx_party_functions_party_function').on(table.partyId, table.function),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
  ],
);

export type PartyFunction = typeof partyFunctions.$inferSelect;
export type NewPartyFunction = typeof partyFunctions.$inferInsert;
