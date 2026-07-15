import { sql } from '@vritti/api-sdk/drizzle-orm';
import { codeCheck, index, pgPolicy, text, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';

export const uomDimensions = coreSchema.table(
  'uom_dimensions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
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
    // Code must be a single lowercase word (hyphens allowed)
    codeCheck('uom_dimensions_code_chk', table.code),
    index('idx_uom_dimensions_org').on(table.organizationId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
  ],
);

export type UomDimension = typeof uomDimensions.$inferSelect;
export type NewUomDimension = typeof uomDimensions.$inferInsert;
