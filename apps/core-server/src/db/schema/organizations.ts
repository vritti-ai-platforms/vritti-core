import type { FeatureLocks } from '@vritti/api-sdk/catalog-resolver';
import { boolean, jsonb, timestamp, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import type { OrgEntitlement, SignedDocument } from '@vritti/api-sdk/license';
import { coreSchema } from './core-schema';
import type { OrgStorage } from './org-storage.types';
import { orgPlanEnum, orgSizeEnum } from './enums';

export const organizations = coreSchema.table('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  subdomain: varchar('subdomain', { length: 100 }).unique().notNull(),
  size: orgSizeEnum('size').notNull(),
  logoUrl: varchar('logo_url', { length: 500 }),
  plan: orgPlanEnum('plan').notNull().default('free'),
  planCode: varchar('plan_code', { length: 100 }),
  businessCode: varchar('business_code', { length: 100 }),
  // Signed entitlement document pushed from cloud — planCode/businessCode are denormalized from it
  entitlement: jsonb('entitlement').$type<SignedDocument<OrgEntitlement>>(),
  // Per-feature lock deny-list gating ORG-scope features in the org context; null = inherit the full plan
  featureLocks: jsonb('feature_locks').$type<FeatureLocks>(),
  // The org's own buckets and the credentials scoped to them. Required: cloud provisions storage before it creates
  // the org and fails the signup if it cannot, so an org without storage is not a state this system produces.
  storage: jsonb('storage').$type<OrgStorage>().notNull(),
  // Set false by cloud's periodic quota check when the org's buckets exceed its plan allowance, and back to true
  // when they drop under it. Core never computes usage — it only honours this verdict.
  storageEnabled: boolean('storage_enabled').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
