import { defineRelations } from '@vritti/api-sdk/drizzle-orm';
import * as schema from './index';

export const relations = defineRelations(schema, (r) => ({
  // User relations
  users: {
    sessions: r.many.sessions(),
    verifications: r.many.verifications(),
    organization: r.one.organizations({
      from: r.users.organizationId,
      to: r.organizations.id,
    }),
    roleAssignments: r.many.userRoleAssignments(),
  },

  // Session relations
  sessions: {
    user: r.one.users({
      from: r.sessions.userId,
      to: r.users.id,
    }),
  },

  // Verification relations
  verifications: {
    user: r.one.users({
      from: r.verifications.userId,
      to: r.users.id,
    }),
  },

  // Organization relations
  organizations: {
    users: r.many.users(),
    businessUnits: r.many.businessUnits(),
    orgRoles: r.many.orgRoles(),
  },

  // Business unit relations
  businessUnits: {
    organization: r.one.organizations({
      from: r.businessUnits.organizationId,
      to: r.organizations.id,
    }),
    parent: r.one.businessUnits({
      from: r.businessUnits.parentId,
      to: r.businessUnits.id,
      alias: 'parent',
    }),
    children: r.many.businessUnits({
      alias: 'parent',
    }),
  },

  // Org role relations
  orgRoles: {
    organization: r.one.organizations({
      from: r.orgRoles.organizationId,
      to: r.organizations.id,
    }),
    assignments: r.many.userRoleAssignments(),
  },

  // User role assignment relations
  userRoleAssignments: {
    user: r.one.users({
      from: r.userRoleAssignments.userId,
      to: r.users.id,
    }),
    orgRole: r.one.orgRoles({
      from: r.userRoleAssignments.orgRoleId,
      to: r.orgRoles.id,
    }),
    businessUnit: r.one.businessUnits({
      from: r.userRoleAssignments.businessUnitId,
      to: r.businessUnits.id,
    }),
  },
}));
