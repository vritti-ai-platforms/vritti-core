import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgPolicy,
  text,
  timestamp,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { catalogs } from './catalogs';
import { commerceSchema } from './commerce-schema';
import { fulfilmentTypeEnum } from './enums';
import { taxGroups } from './tax-groups';

export const offerings = commerceSchema.table(
  'offerings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    siteId: uuid('site_id').notNull().default(sql.raw("cast(current_setting('app.site_id') as uuid)")),
    catalogId: uuid('catalog_id')
      .notNull()
      .references(() => catalogs.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id'),
    fulfilmentType: fulfilmentTypeEnum('fulfilment_type').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    salesTaxGroupId: uuid('sales_tax_group_id')
      .notNull()
      .references(() => taxGroups.id),
    isAvailable: boolean('is_available').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    attributes: jsonb('attributes').notNull().default({}),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_offerings_site').on(table.organizationId, table.siteId),
    index('idx_offerings_catalog').on(table.catalogId),
    index('idx_offerings_category').on(table.categoryId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
    pgPolicy('site_read', {
      for: 'select',
      using: sql`site_id = (select current_setting('app.site_id', true)::uuid)`,
    }),
    pgPolicy('site_write', {
      for: 'insert',
      withCheck: sql`site_id = (select current_setting('app.site_id', true)::uuid)`,
    }),
    pgPolicy('site_update', {
      for: 'update',
      using: sql`site_id = (select current_setting('app.site_id', true)::uuid)`,
    }),
    pgPolicy('site_delete', {
      for: 'delete',
      using: sql`site_id = (select current_setting('app.site_id', true)::uuid)`,
    }),
  ],
);

export type Offering = typeof offerings.$inferSelect;
export type NewOffering = typeof offerings.$inferInsert;
