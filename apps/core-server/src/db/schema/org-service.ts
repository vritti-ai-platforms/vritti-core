import { sql } from '@vritti/api-sdk/drizzle-orm';
import { index, jsonb, pgPolicy, timestamp, uniqueIndex, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { serviceTypeEnum } from './enums';
import { organizations } from './organizations';

// One row per external service the organization has provisioned. Presence IS the answer to "is this
// service available" — features declaring a service stay locked until the matching row exists.
export const orgServices = coreSchema.table(
  'org_services',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    service: serviceTypeEnum('service').notNull(),
    // The provider's own identifiers — for Gitea, its numeric org id and the namespace
    externalId: varchar('external_id', { length: 255 }),
    externalName: varchar('external_name', { length: 255 }),
    // Per-service extras that don't deserve their own column
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('org_services_organization_id_idx').on(table.organizationId),
    uniqueIndex('org_services_org_service_unique').on(table.organizationId, table.service),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid)`,
    }),
  ],
);

export type OrgService = typeof orgServices.$inferSelect;
export type NewOrgService = typeof orgServices.$inferInsert;
