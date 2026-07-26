import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type AnyPgColumn,
  boolean,
  codeCheck,
  index,
  pgPolicy,
  timestamp,
  unique,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { taxJurisdictionLevelEnum } from './enums';

export const taxJurisdictions = commerceSchema.table(
  'tax_jurisdictions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    level: taxJurisdictionLevelEnum('level').notNull(),
    parentId: uuid('parent_id').references((): AnyPgColumn => taxJurisdictions.id),
    countryCode: varchar('country_code', { length: 2 }).notNull(),
    regionCode: varchar('region_code', { length: 10 }),
    taxUnion: varchar('tax_union', { length: 50 }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_tax_jurisdictions_org_code').on(table.organizationId, table.code),
    index('idx_tax_jurisdictions_org').on(table.organizationId),
    index('idx_tax_jurisdictions_parent').on(table.parentId),
    codeCheck('tax_jurisdictions_code_chk', table.code),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
  ],
);

export type TaxJurisdiction = typeof taxJurisdictions.$inferSelect;
export type NewTaxJurisdiction = typeof taxJurisdictions.$inferInsert;
