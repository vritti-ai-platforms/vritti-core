import { boolean, timestamp, uniqueIndex, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { businessUnits } from './business-unit';
import { coreSchema } from './core-schema';
import { assignmentTypeEnum } from './enums';
import { orgRoles } from './org-role';
import { users } from './users';

export const userRoleAssignments = coreSchema.table(
  'user_role_assignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    orgRoleId: uuid('org_role_id')
      .notNull()
      .references(() => orgRoles.id, { onDelete: 'cascade' }),
    businessUnitId: uuid('business_unit_id')
      .notNull()
      .references(() => businessUnits.id, { onDelete: 'cascade' }),
    assignmentType: assignmentTypeEnum('assignment_type').notNull().default('DIRECT'),
    grantedBy: uuid('granted_by').references(() => users.id, { onDelete: 'set null' }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('user_role_assignments_user_role_bu_unique').on(
      table.userId,
      table.orgRoleId,
      table.businessUnitId,
    ),
  ],
);

export type UserRoleAssignment = typeof userRoleAssignments.$inferSelect;
export type NewUserRoleAssignment = typeof userRoleAssignments.$inferInsert;
