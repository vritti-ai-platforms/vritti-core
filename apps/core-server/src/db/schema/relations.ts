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

  // Media relations
  media: {
    uploadedByUser: r.one.users({
      from: r.media.uploadedBy,
      to: r.users.id,
    }),
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
    roles: r.many.roles(),
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

  // Role relations
  roles: {
    organization: r.one.organizations({
      from: r.roles.organizationId,
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
    role: r.one.roles({
      from: r.userRoleAssignments.roleId,
      to: r.roles.id,
    }),
    businessUnit: r.one.businessUnits({
      from: r.userRoleAssignments.businessUnitId,
      to: r.businessUnits.id,
    }),
  },
}));
