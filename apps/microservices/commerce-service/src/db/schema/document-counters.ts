import { sql } from '@vritti/api-sdk/drizzle-orm';
import { bigint, pgPolicy, timestamp, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { organizationIdColumn } from './workspace-scope';

export const documentCounters = commerceSchema.table(
  'document_counters',
  {
    organizationId: organizationIdColumn,
    counterKey: varchar('counter_key', { length: 120 }).notNull(),
    lastNumber: bigint('last_number', { mode: 'bigint' }).notNull().default(0n),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`${table.organizationId} = (select current_setting('app.org_id', true)::uuid)`,
      withCheck: sql`${table.organizationId} = (select current_setting('app.org_id', true)::uuid)`,
    }),
  ],
);
