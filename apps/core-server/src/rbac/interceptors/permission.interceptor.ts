import { type CallHandler, type ExecutionContext, Injectable, Logger, type NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { API_SURFACES, BUCKET_BY_SURFACE, type PlatformBucket } from '@vritti/api-sdk/catalog-resolver';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { ForbiddenException } from '@vritti/api-sdk/exceptions';
import type { Observable } from 'rxjs';
import { SessionTypeValues } from '@/db/schema';
import {
  type GrantSource,
  type PermissionContext,
  UserPermissionsDomainService,
} from '@/modules/domain/user-permissions/services/user-permissions.service';
import { getRequest } from '@/utils/request-context';
import { REQUIRE_FEATURE_KEY, SKIP_FEATURE_KEY } from '../decorators/require-feature.decorator';
import { REQUIRE_PERMISSION_KEY } from '../decorators/require-permission.decorator';

@Injectable()
export class PermissionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PermissionInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly userPermissionsService: UserPermissionsDomainService,
    private readonly primaryDb: PrimaryDatabaseService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = getRequest(context);
    const targets = [context.getHandler(), context.getClass()];
    const requiredPermission = this.reflector.getAllAndOverride<string | undefined>(REQUIRE_PERMISSION_KEY, targets);
    const skipFeature = this.reflector.getAllAndOverride<boolean | undefined>(SKIP_FEATURE_KEY, targets);
    const requiredFeature = skipFeature
      ? undefined
      : this.reflector.getAllAndOverride<string | undefined>(REQUIRE_FEATURE_KEY, targets);

    this.logger.debug(
      `→ ${request.method} ${request.url} | permission=${requiredPermission ?? '—'} feature=${requiredFeature ?? '—'}${skipFeature ? ' (skip-feature)' : ''}`,
    );
    if (!requiredPermission && !requiredFeature) return next.handle();

    const auth = request.auth;
    const siteId = auth?.siteId;
    const siteGroupId = auth?.siteGroupId;
    const legalEntityId = auth?.legalEntityId;
    const orgId = auth?.organizationId;
    this.logger.debug(
      `  auth: kind=${auth?.kind} siteId=${siteId} siteGroupId=${siteGroupId} legalEntityId=${legalEntityId} orgId=${orgId}`,
    );

    // Only a session or an app carries grants.
    if (!orgId || (auth?.kind !== 'session' && auth?.kind !== 'app')) {
      this.logger.warn(`  DENY — no grant-bearing principal (kind=${auth?.kind ?? 'none'}, orgId=${orgId ?? 'none'})`);
      throw new ForbiddenException('You do not have permission to perform this action.');
    }

    // Workspace context by precedence: SITE > SITE_GROUP > LE > ORG (no context header = org workspace)
    const ctx: PermissionContext = siteId
      ? { scope: 'SITE', id: siteId }
      : siteGroupId
        ? { scope: 'SITE_GROUP', id: siteGroupId }
        : legalEntityId
          ? { scope: 'LE', id: legalEntityId }
          : { scope: 'ORG', id: orgId };

    // Platform bucket follows the caller: MOBILE enforces the mobile feature set, an app credential the bucket of its
    // own surface (GRAPHQL → graphql, HTTP → http), everything else web.
    let bucket: PlatformBucket;
    if (auth.kind === 'app') {
      const surface = API_SURFACES.find((s) => s === auth.appType);
      if (!surface) {
        this.logger.warn(`  DENY — app with unrecognised type ${auth.appType ?? '(none)'}`);
        throw new ForbiddenException('You do not have permission to perform this action.');
      }
      bucket = BUCKET_BY_SURFACE[surface];
    } else {
      bucket = auth.sessionType === SessionTypeValues.MOBILE ? 'mobile' : 'web';
    }

    const source: GrantSource =
      auth.kind === 'app'
        ? { kind: 'app', appId: auth.appId, grants: auth.permissions ?? {} }
        : { kind: 'user', userId: auth.userId };

    // A specific permission subsumes the feature switch — an enabled permission implies its feature is unlocked
    if (requiredPermission) {
      const enabled = await this.primaryDb.runWithRlsContext({ orgId }, () =>
        this.userPermissionsService.resolveEnabledPermissions(source, ctx, bucket),
      );
      if (!enabled.has(requiredPermission)) {
        this.logger.warn(`  DENY ${requiredPermission} — not in enabled set`);
        throw new ForbiddenException('You do not have permission to perform this action.');
      }
      this.logger.debug(`  ALLOW ${requiredPermission}`);
      return next.handle();
    }

    // No specific permission (e.g. count) — gate on the feature switch being on for this user's site
    if (requiredFeature) {
      const available = await this.primaryDb.runWithRlsContext({ orgId }, () =>
        this.userPermissionsService.resolveAvailableFeatures(source, ctx, bucket),
      );
      if (!available.has(requiredFeature)) {
        this.logger.warn(`  DENY feature ${requiredFeature} — switch off / not available`);
        throw new ForbiddenException('This feature is not available for your sites.');
      }
      this.logger.debug(`  ALLOW feature ${requiredFeature}`);
    }
    return next.handle();
  }
}
