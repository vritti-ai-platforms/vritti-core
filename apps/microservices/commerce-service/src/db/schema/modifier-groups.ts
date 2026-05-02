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
import { coreSchema } from './core-schema';
import { modifierSelectionTypeEnum } from './enums';

export const modifierGroups = coreSchema.table(
  'modifier_groups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("current_setting('app.org_id')::uuid")),
    businessUnitId: uuid('business_unit_id').notNull().default(sql.raw("current_setting('app.bu_id')::uuid")),
    name: varchar('name', { length: 255 }).notNull(),
    selectionType: modifierSelectionTypeEnum('selection_type').notNull(),
    minSelections: integer('min_selections').notNull().default(0),
    maxSelections: integer('max_selections'),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('uq_modifier_groups_bu_name').on(table.businessUnitId, table.name),
    index('idx_modifier_groups_bu').on(table.organizationId, table.businessUnitId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = current_setting('app.org_id', true)::uuid`,
    }),
    pgPolicy('bu_ancestor_read', {
      for: 'select',
      using: sql`business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[])`,
    }),
    pgPolicy('bu_write', {
      for: 'insert',
      withCheck: sql`business_unit_id = current_setting('app.bu_id', true)::uuid`,
    }),
    pgPolicy('bu_update', {
      for: 'update',
      using: sql`business_unit_id = current_setting('app.bu_id', true)::uuid`,
    }),
    pgPolicy('bu_delete', {
      for: 'delete',
      using: sql`business_unit_id = current_setting('app.bu_id', true)::uuid`,
    }),
  ],
);

export type ModifierGroup = typeof modifierGroups.$inferSelect;
export type NewModifierGroup = typeof modifierGroups.$inferInsert;

export const modifierOptions = coreSchema.table(
  'modifier_options',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("current_setting('app.org_id')::uuid")),
    groupId: uuid('group_id').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    additionalPrice: bigint('additional_price', { mode: 'number' }).notNull().default(0),
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

export const itemModifierGroups = coreSchema.table(
  'item_modifier_groups',
  {
    organizationId: uuid('organization_id').notNull().default(sql.raw("current_setting('app.org_id')::uuid")),
    itemId: uuid('item_id').notNull(),
    groupId: uuid('group_id').notNull(),
  },
  (table) => [primaryKey({ columns: [table.itemId, table.groupId] })],
);

export type ItemModifierGroup = typeof itemModifierGroups.$inferSelect;
export type NewItemModifierGroup = typeof itemModifierGroups.$inferInsert;
