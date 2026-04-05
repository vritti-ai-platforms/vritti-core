import { boolean, decimal, index, integer, jsonb, primaryKey, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { modifierSelectionTypeEnum } from './enums';
import { coreSchema } from './core-schema';

export const modifierGroups = coreSchema.table(
  'modifier_groups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessUnitId: uuid('business_unit_id').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    selectionType: modifierSelectionTypeEnum('selection_type').notNull(),
    minSelections: integer('min_selections').notNull().default(0),
    maxSelections: integer('max_selections'),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    unique('uq_modifier_groups_bu_name').on(table.businessUnitId, table.name),
    index('idx_modifier_groups_bu').on(table.businessUnitId),
  ],
);

export type ModifierGroup = typeof modifierGroups.$inferSelect;
export type NewModifierGroup = typeof modifierGroups.$inferInsert;

export const modifierOptions = coreSchema.table(
  'modifier_options',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('group_id').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    additionalPrice: decimal('additional_price', { precision: 12, scale: 2 }).notNull().default('0'),
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
    itemId: uuid('item_id').notNull(),
    groupId: uuid('group_id').notNull(),
  },
  (table) => [primaryKey({ columns: [table.itemId, table.groupId] })],
);

export type ItemModifierGroup = typeof itemModifierGroups.$inferSelect;
export type NewItemModifierGroup = typeof itemModifierGroups.$inferInsert;
