import { sql } from '@vritti/api-sdk/drizzle-orm';
import { boolean, check, timestamp, unique, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { assignmentTypeEnum } from './enums';
import { legalEntities } from './legal-entity';
import { roles } from './role';
import { sites } from './site';
import { siteGroups } from './site-group';
import { users } from './users';

export const userRoleAssignments = coreSchema.table(
  'user_role_assignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    // Assignment target: exactly one of siteId / siteGroupId / legalEntityId, or all NULL = org-wide
    siteId: uuid('site_id').references(() => sites.id, { onDelete: 'cascade' }),
    siteGroupId: uuid('site_group_id').references(() => siteGroups.id, { onDelete: 'cascade' }),
    legalEntityId: uuid('legal_entity_id').references(() => legalEntities.id, { onDelete: 'cascade' }),
    assignmentType: assignmentTypeEnum('assignment_type').notNull().default('DIRECT'),
    grantedBy: uuid('granted_by').references(() => users.id, { onDelete: 'set null' }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    // At most one target column set — all NULL means the assignment is org-wide
    check('user_role_assignments_single_target', sql`num_nonnulls(site_id, site_group_id, legal_entity_id) <= 1`),
    // One role per user per target (NULLS NOT DISTINCT so a user holds one org-wide role at most)
    unique('user_role_assignments_user_target_unique')
      .on(table.userId, table.siteId, table.siteGroupId, table.legalEntityId)
      .nullsNotDistinct(),
  ],
);

export type UserRoleAssignment = typeof userRoleAssignments.$inferSelect;
export type NewUserRoleAssignment = typeof userRoleAssignments.$inferInsert;
