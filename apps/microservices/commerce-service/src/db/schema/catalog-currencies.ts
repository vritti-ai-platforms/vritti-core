import { sql } from '@vritti/api-sdk/drizzle-orm';
import { index, integer, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { catalogs } from './catalogs';
import { commerceSchema } from './commerce-schema';
import { organizationIdColumn, scopeFromOwnerPolicies } from './workspace-scope';

export const catalogCurrencies = commerceSchema.table(
  'catalog_currencies',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn,
    catalogId: uuid('catalog_id')
      .notNull()
      .references(() => catalogs.id, { onDelete: 'cascade' }),
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_catalog_currencies').on(table.catalogId, table.currencyCode),
    index('idx_catalog_currencies_catalog').on(table.catalogId, table.sortOrder),
    ...scopeFromOwnerPolicies({ owner: catalogs, fk: table.catalogId }),
  ],
);

export type CatalogCurrency = typeof catalogCurrencies.$inferSelect;
export type NewCatalogCurrency = typeof catalogCurrencies.$inferInsert;
