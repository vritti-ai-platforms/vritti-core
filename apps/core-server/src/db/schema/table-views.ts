import { dataTableViewsColumns, dataTableViewsIndexes } from '@vritti/api-sdk';
import { uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { users } from './users';

export const tableViews = coreSchema.table(
  'table_views',
  {
    ...dataTableViewsColumns(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  dataTableViewsIndexes,
);

export type TableView = typeof tableViews.$inferSelect;
export type NewTableView = typeof tableViews.$inferInsert;
