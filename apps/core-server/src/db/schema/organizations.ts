import { timestamp, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { orgPlanEnum, orgSizeEnum } from './enums';

export interface FeatureCatalogEntry {
  code: string;
  name: string;
  lucideIcon: string | null;
  sfSymbol: string;
  materialSymbol: string;
  // WEB route — present when feature has a web microfrontend
  web: {
    remoteEntry: string;
    exposedModule: string;
    routePrefix: string;
  } | null;
  // MOBILE route — present when feature has a mobile microfrontend
  mobile: {
    remoteEntryAndroid: string;
    remoteEntryIos: string;
    exposedModule: string;
    routePrefix: string;
  } | null;
  appCode: string;
  appName: string;
  appIcon: string | null;
  appSortOrder: number;
  // Lock overlay: locked + why (PLAN = org's plan, BU = this BU restricts) + plans that would unlock it (upsell)
  locked: boolean;
  lockReason: LockReason | null;
  unlockPlans: string[];
  permissions: Array<{ code: string; locked: boolean; lockReason: LockReason | null; unlockPlans: string[] }>;
}

// Why a feature/permission is locked
export type LockReason = 'PLAN' | 'BU';

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
