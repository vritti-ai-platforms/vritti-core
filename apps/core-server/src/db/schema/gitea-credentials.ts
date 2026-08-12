import { sql } from '@vritti/api-sdk/drizzle-orm';
import { check, integer, text, timestamp } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';

// Singleton row holding the live Gitea credentials. The deployment agent OWNS this row — it provisions
// Gitea and writes the base URL, the all-scopes admin PAT core authenticates with, and the read:package
// pull token served to the ws-agent. Core only ever READS it; the agent rotates the tokens in place and
// stamps rotatedAt. Every column but the primary key is nullable because the agent may write before the
// values exist. The check constraint pins the table to exactly one row.
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
