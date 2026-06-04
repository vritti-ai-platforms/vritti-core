import { timestamp, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { orgPlanEnum, orgSizeEnum } from './enums';

export interface FeatureCatalogEntry {
  code: string;
  name: string;
  icon: string | null;
  remoteEntry: string;
  exposedModule: string;
  routePrefix: string;
  appCode: string;
  appName: string;
  appIcon: string | null;
  appSortOrder: number;
}

export const organizations = coreSchema.table('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  subdomain: varchar('subdomain', { length: 100 }).unique().notNull(),
  size: orgSizeEnum('size').notNull(),
  logoUrl: varchar('logo_url', { length: 500 }),
  plan: orgPlanEnum('plan').notNull().default('free'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
