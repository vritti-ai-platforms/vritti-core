import { boolean, integer, jsonb, timestamp, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { fieldTypeEnum } from './enums';

export const itemFieldDefinitions = coreSchema.table('item_field_definitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessUnitId: uuid('business_unit_id').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  fieldType: fieldTypeEnum('field_type').notNull(),
  options: jsonb('options').$type<string[]>().notNull().default([]),
  isRequired: boolean('is_required').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type ItemFieldDefinition = typeof itemFieldDefinitions.$inferSelect;
export type NewItemFieldDefinition = typeof itemFieldDefinitions.$inferInsert;
