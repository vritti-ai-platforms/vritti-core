import { sql } from '@vritti/api-sdk/drizzle-orm';
import { check, integer, text, timestamp } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';

export const giteaCredentials = coreSchema.table(
  'gitea_credentials',
  {
    id: integer('id').primaryKey().default(1),
    baseUrl: text('base_url'),
    coreToken: text('core_token'),
    pullToken: text('pull_token'),
    rotatedAt: timestamp('rotated_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [check('gitea_credentials_singleton', sql`${table.id} = 1`)],
);

export type GiteaCredentials = typeof giteaCredentials.$inferSelect;
export type NewGiteaCredentials = typeof giteaCredentials.$inferInsert;
