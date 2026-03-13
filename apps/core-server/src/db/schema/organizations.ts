import { integer, timestamp, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { orgPlanEnum, orgSizeEnum } from './enums';
import { nexusSchema } from './nexus-schema';

export const organizations = nexusSchema.table('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  subdomain: varchar('subdomain', { length: 100 }).unique().notNull(),
  size: orgSizeEnum('size').notNull(),
  mediaId: integer('media_id'),
  plan: orgPlanEnum('plan').notNull().default('free'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
