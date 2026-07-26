import { sql } from '@vritti/api-sdk/drizzle-orm';
import { boolean, codeCheck, index, pgPolicy, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { taxAuthorityLevelEnum } from './enums';

export const taxComponents = commerceSchema.table(
  'tax_components',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    authorityLevel: taxAuthorityLevelEnum('authority_level').notNull(),
    isRecoverable: boolean('is_recoverable').notNull().default(true),
    isWithholding: boolean('is_withholding').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    isSystem: boolean('is_system').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_tax_components_org_code').on(table.organizationId, table.code),
    index('idx_tax_components_org').on(table.organizationId),
    codeCheck('tax_components_code_chk', table.code),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
  ],
);

export type TaxComponent = typeof taxComponents.$inferSelect;
export type NewTaxComponent = typeof taxComponents.$inferInsert;
