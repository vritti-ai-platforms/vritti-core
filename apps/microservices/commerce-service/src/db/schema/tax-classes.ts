import { boolean, codeCheck, index, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { organizationIdColumn, orgIsolationPolicy } from './workspace-scope';

export const taxClasses = commerceSchema.table(
  'tax_classes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: organizationIdColumn,
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    isActive: boolean('is_active').notNull().default(true),
    isSystem: boolean('is_system').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_tax_classes_org_code').on(table.organizationId, table.code),
    index('idx_tax_classes_org').on(table.organizationId),
    codeCheck('tax_classes_code_chk', table.code),
    orgIsolationPolicy(),
  ],
);

export type TaxClass = typeof taxClasses.$inferSelect;
export type NewTaxClass = typeof taxClasses.$inferInsert;
