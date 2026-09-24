import { codeCheck, index, text, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { organizationIdColumn, orgIsolationPolicy } from './workspace-scope';

export const uomDimensions = commerceSchema.table(
  'uom_dimensions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: organizationIdColumn,
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_uom_dimensions_org_code').on(table.organizationId, table.code),
    codeCheck('uom_dimensions_code_chk', table.code),
    index('idx_uom_dimensions_org').on(table.organizationId),
    orgIsolationPolicy(),
  ],
);

export type UomDimension = typeof uomDimensions.$inferSelect;
export type NewUomDimension = typeof uomDimensions.$inferInsert;
