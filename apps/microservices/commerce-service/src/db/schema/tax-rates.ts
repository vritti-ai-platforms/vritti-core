import { decimal, integer, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { taxGroups } from './tax-groups';

export const taxRates = coreSchema.table('tax_rates', {
  id: uuid('id').primaryKey().defaultRandom(),
  taxGroupId: uuid('tax_group_id')
    .notNull()
    .references(() => taxGroups.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  rate: decimal('rate', { precision: 5, scale: 2, mode: 'number' }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export type TaxRate = typeof taxRates.$inferSelect;
export type NewTaxRate = typeof taxRates.$inferInsert;
