import { API_SURFACES, BUCKET_BY_SURFACE, type PlatformBucket } from '@vritti/api-sdk/catalog-resolver';
import type { FastifyRequest } from 'fastify';
import { SessionTypeValues } from '@/db/schema';
import type {
  GrantSource,
  PermissionContext,
} from '@/modules/domain/user-permissions/services/user-permissions.service';

export interface PermissionCaller {
  orgId: string;
  ctx: PermissionContext;
  bucket: PlatformBucket;
  source: GrantSource;
}

// Who is asking, in which workspace and from which surface — or null when the request carries no grants (no
// organization, a principal that is neither a session nor an app, or an app of an unrecognised type)
export function resolvePermissionCaller(auth: FastifyRequest['auth']): PermissionCaller | null {
  const orgId = auth?.organizationId;
  if (!orgId || (auth?.kind !== 'session' && auth?.kind !== 'app')) return null;

  // Workspace context by precedence: SITE > SITE_GROUP > LE > ORG (no context header = org workspace)
  const ctx: PermissionContext = auth.siteId
    ? { scope: 'SITE', id: auth.siteId }
    : auth.siteGroupId
      ? { scope: 'SITE_GROUP', id: auth.siteGroupId }
      : auth.legalEntityId
        ? { scope: 'LE', id: auth.legalEntityId }
        : { scope: 'ORG', id: orgId };

  // Platform bucket follows the caller: MOBILE enforces the mobile feature set, an app credential the bucket of its
  // own surface (GRAPHQL → graphql, HTTP → http), everything else web.
  let bucket: PlatformBucket;
  if (auth.kind === 'app') {
    const surface = API_SURFACES.find((s) => s === auth.appType);
    if (!surface) return null;
    bucket = BUCKET_BY_SURFACE[surface];
  } else {
    bucket = auth.sessionType === SessionTypeValues.MOBILE ? 'mobile' : 'web';
  }

  const source: GrantSource =
    auth.kind === 'app'
      ? { kind: 'app', appId: auth.appId, grants: auth.permissions ?? {} }
      : { kind: 'user', userId: auth.userId };

  return { orgId, ctx, bucket, source };
}
