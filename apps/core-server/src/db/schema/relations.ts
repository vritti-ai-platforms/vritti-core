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
    apps: r.many.apps(),
    sites: r.many.sites(),
    siteGroups: r.many.siteGroups(),
    roles: r.many.roles(),
    legalEntities: r.many.legalEntities(),
    orgServices: r.many.orgServices(),
  },

  // API credentials issued to external clients. An app belongs to an org and to
  // nothing else — it is a caller, not a person.
  apps: {
    organization: r.one.organizations({
      from: r.apps.organizationId,
      to: r.organizations.id,
    }),
  },

  // Provisioned external service relations
  orgServices: {
    organization: r.one.organizations({
      from: r.orgServices.organizationId,
      to: r.organizations.id,
    }),
  },

  legalEntities: {
    organization: r.one.organizations({
      from: r.legalEntities.organizationId,
      to: r.organizations.id,
    }),
    parent: r.one.legalEntities({
      from: r.legalEntities.parentId,
      to: r.legalEntities.id,
      alias: 'leParent',
    }),
    subsidiaries: r.many.legalEntities({
      alias: 'leParent',
    }),
    taxRegistrations: r.many.leTaxRegistrations(),
    sites: r.many.sites(),
  },

  leTaxRegistrations: {
    organization: r.one.organizations({
      from: r.leTaxRegistrations.organizationId,
      to: r.organizations.id,
    }),
    legalEntity: r.one.legalEntities({
      from: r.leTaxRegistrations.legalEntityId,
      to: r.legalEntities.id,
    }),
    sites: r.many.sites(),
  },

  // Site group relations
  siteGroups: {
    organization: r.one.organizations({
      from: r.siteGroups.organizationId,
      to: r.organizations.id,
    }),
    parent: r.one.siteGroups({
      from: r.siteGroups.parentId,
      to: r.siteGroups.id,
      alias: 'groupParent',
    }),
    children: r.many.siteGroups({
      alias: 'groupParent',
    }),
    sites: r.many.sites(),
  },

  // Site relations
  sites: {
    organization: r.one.organizations({
      from: r.sites.organizationId,
      to: r.organizations.id,
    }),
    group: r.one.siteGroups({
      from: r.sites.groupId,
      to: r.siteGroups.id,
    }),
    legalEntity: r.one.legalEntities({
      from: r.sites.legalEntityId,
      to: r.legalEntities.id,
    }),
    registration: r.one.leTaxRegistrations({
      from: r.sites.registrationId,
      to: r.leTaxRegistrations.id,
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
    site: r.one.sites({
      from: r.userRoleAssignments.siteId,
      to: r.sites.id,
    }),
    siteGroup: r.one.siteGroups({
      from: r.userRoleAssignments.siteGroupId,
      to: r.siteGroups.id,
    }),
    legalEntity: r.one.legalEntities({
      from: r.userRoleAssignments.legalEntityId,
      to: r.legalEntities.id,
    }),
  },
}));
