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
  },
}));
