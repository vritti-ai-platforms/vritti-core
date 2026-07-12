import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgPolicy,
  primaryKey,
  timestamp,
  unique,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { catalogs } from './catalogs';
import { coreSchema } from './core-schema';
import { modifierSelectionTypeEnum } from './enums';

export const modifierGroups = coreSchema.table(
  'modifier_groups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    siteId: uuid('site_id').notNull().default(sql.raw("cast(current_setting('app.site_id') as uuid)")),
    catalogId: uuid('catalog_id')
      .notNull()
      .references(() => catalogs.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    selectionType: modifierSelectionTypeEnum('selection_type').notNull(),
    minSelections: integer('min_selections').notNull().default(0),
    maxSelections: integer('max_selections'),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('uq_modifier_groups_catalog_name').on(table.catalogId, table.name),
    index('idx_modifier_groups_site').on(table.organizationId, table.siteId),
    index('idx_modifier_groups_catalog').on(table.catalogId),
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

export type ModifierGroup = typeof modifierGroups.$inferSelect;
export type NewModifierGroup = typeof modifierGroups.$inferInsert;

export const modifierOptions = coreSchema.table(
  'modifier_options',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    groupId: uuid('group_id').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    additionalPrice: bigint('additional_price', { mode: 'bigint' }).notNull().default(0n),
    isDefault: boolean('is_default').notNull().default(false),
    isAvailable: boolean('is_available').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    attributes: jsonb('attributes').notNull().default({}),
  },
  (table) => [
    unique('uq_modifier_options_group_name').on(table.groupId, table.name),
    index('idx_modifier_options_group').on(table.groupId),
  ],
);

export type ModifierOption = typeof modifierOptions.$inferSelect;
export type NewModifierOption = typeof modifierOptions.$inferInsert;

export const offeringModifierGroups = coreSchema.table(
  'offering_modifier_groups',
  {
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    offeringId: uuid('offering_id').notNull(),
    groupId: uuid('group_id').notNull(),
  },
  (table) => [primaryKey({ columns: [table.offeringId, table.groupId] })],
);

export type OfferingModifierGroup = typeof offeringModifierGroups.$inferSelect;
export type NewOfferingModifierGroup = typeof offeringModifierGroups.$inferInsert;
