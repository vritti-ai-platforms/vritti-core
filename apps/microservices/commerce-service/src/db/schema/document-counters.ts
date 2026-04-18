import { sql } from '@vritti/api-sdk/drizzle-orm';
import { bigint, pgPolicy, timestamp, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';

export const documentCounters = coreSchema.table(
  'document_counters',
  {
    organizationId: uuid('organization_id').notNull().default(sql`current_setting('app.org_id')::uuid`),
    counterKey: varchar('counter_key', { length: 120 }).notNull(),
    lastNumber: bigint('last_number', { mode: 'number' }).notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`${table.organizationId} = current_setting('app.org_id', true)::uuid`,
      withCheck: sql`${table.organizationId} = current_setting('app.org_id', true)::uuid`,
    }),
  ],
);
