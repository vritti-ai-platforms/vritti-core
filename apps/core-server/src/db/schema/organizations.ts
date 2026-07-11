import type { FeatureLocks } from '@vritti/api-sdk/catalog-resolver';
import { jsonb, timestamp, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import type { OrgEntitlement, SignedDocument } from '@vritti/api-sdk/license';
import { coreSchema } from './core-schema';
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
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
