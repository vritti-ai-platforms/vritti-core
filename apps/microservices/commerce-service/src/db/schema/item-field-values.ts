import { sql } from '@vritti/api-sdk/drizzle-orm';
import { text, timestamp, uniqueIndex, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { itemFieldDefinitions } from './item-field-definitions';
import { offerings } from './offerings';

export const itemFieldValues = coreSchema.table(
  'item_field_values',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    itemId: uuid('item_id')
      .notNull()
      .references(() => offerings.id, { onDelete: 'cascade' }),
    fieldDefinitionId: uuid('field_definition_id')
      .notNull()
      .references(() => itemFieldDefinitions.id, { onDelete: 'cascade' }),
    value: text('value'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex('uq_item_field_value').on(table.itemId, table.fieldDefinitionId)],
);

export type ItemFieldValue = typeof itemFieldValues.$inferSelect;
export type NewItemFieldValue = typeof itemFieldValues.$inferInsert;
