import { text, timestamp, uniqueIndex, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { itemFieldDefinitions } from './item-field-definitions';
import { items } from './items';

export const itemFieldValues = coreSchema.table(
  'item_field_values',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    itemId: uuid('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
    fieldDefinitionId: uuid('field_definition_id').notNull().references(() => itemFieldDefinitions.id, { onDelete: 'cascade' }),
    value: text('value'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex('uq_item_field_value').on(table.itemId, table.fieldDefinitionId)],
);

export type ItemFieldValue = typeof itemFieldValues.$inferSelect;
export type NewItemFieldValue = typeof itemFieldValues.$inferInsert;
