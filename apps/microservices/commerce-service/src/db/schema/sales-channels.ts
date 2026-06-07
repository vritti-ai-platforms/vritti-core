import { sql } from '@vritti/api-sdk/drizzle-orm';
import { boolean, index, pgPolicy, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { salesChannelKindEnum } from './enums';

export const salesChannels = coreSchema.table(
  'sales_channels',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    kind: salesChannelKindEnum('kind').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    isSystem: boolean('is_system').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_sales_channels_org_code').on(table.organizationId, table.code),
    index('idx_sales_channels_org').on(table.organizationId),
    index('idx_sales_channels_kind').on(table.kind),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
  ],
);

export type SalesChannel = typeof salesChannels.$inferSelect;
export type NewSalesChannel = typeof salesChannels.$inferInsert;
