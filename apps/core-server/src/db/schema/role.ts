import type { FeatureUnlocks, RevokedGrants } from '@vritti/api-sdk/catalog-resolver';
import { boolean, jsonb, text, timestamp, uniqueIndex, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';

import { coreSchema } from './core-schema';
import { organizations } from './organizations';

export const roles = coreSchema.table(
  'roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    // The template this role builds on — effective grants composed at read time from the active snapshot.
    // A role with zero deltas (empty features + revoked) is a "default" role that tracks its template exactly.
    code: varchar('code', { length: 255 }).notNull(),
    // featureCode → granted permission codes per platform bucket — the role's own grant deltas
    features: jsonb('features').$type<FeatureUnlocks>().notNull().default({}),
    // Inherited grants removed from the base — null platform revokes membership, string[] revokes codes
    revoked: jsonb('revoked').$type<RevokedGrants>(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  // Names stay unique; codes do NOT — many roles can build on the same template
  (table) => [uniqueIndex('roles_org_name_unique').on(table.organizationId, table.name)],
);

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
