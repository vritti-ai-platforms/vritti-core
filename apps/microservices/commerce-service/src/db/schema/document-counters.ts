import { sql } from '@vritti/api-sdk/drizzle-orm';
import { bigint, pgPolicy, timestamp, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';

export const documentCounters = commerceSchema.table(
  'document_counters',
  {
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
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
