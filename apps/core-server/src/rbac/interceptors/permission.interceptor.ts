import { type CallHandler, type ExecutionContext, Injectable, Logger, type NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { APP_SESSION_TYPE } from '@vritti/api-sdk/auth';
import { API_SURFACES, BUCKET_BY_SURFACE, isApiBucket, type PlatformBucket } from '@vritti/api-sdk/catalog-resolver';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { ForbiddenException } from '@vritti/api-sdk/exceptions';
import type { Observable } from 'rxjs';
import { SessionTypeValues } from '@/db/schema';
import {
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

    const userId = request.sessionInfo?.userId;
    const siteId = request.sessionInfo?.siteId;
    const siteGroupId = request.sessionInfo?.siteGroupId;
    const legalEntityId = request.sessionInfo?.legalEntityId;
    const orgId = request.sessionInfo?.organizationId;
    const sessionType = request.sessionInfo?.sessionType;
    this.logger.debug(
      `  session: userId=${userId} siteId=${siteId} siteGroupId=${siteGroupId} legalEntityId=${legalEntityId} orgId=${orgId} sessionType=${sessionType}`,
    );
    if (!userId || !orgId) {
      this.logger.warn('  DENY — missing session context (userId/orgId)');
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

    // Platform bucket follows the session type: MOBILE enforces the mobile feature set, an app
    // credential the bucket of its own surface (GRAPHQL → graphql, HTTP → http), everything else
    // web. The credential type BEING the bucket is what lets a plan entitle each API surface
    // independently, and what frees a headless feature from needing a microfrontend to be reachable.
    //
    // Fails closed: an app session whose type is missing or unrecognised resolves nothing rather
    // than everything.
    let bucket: PlatformBucket;
    if (sessionType === APP_SESSION_TYPE) {
      const appType = request.sessionInfo?.appType;
      const surface = API_SURFACES.find((s) => s === appType);
      if (!surface) {
        this.logger.warn(`  DENY — app session with unrecognised type ${appType ?? '(none)'}`);
        throw new ForbiddenException('You do not have permission to perform this action.');
      }
      bucket = BUCKET_BY_SURFACE[surface];
    } else {
      bucket = sessionType === SessionTypeValues.MOBILE ? 'mobile' : 'web';
    }

    // An app's grants sit on its credential rather than coming from role assignments, so the
    // grant source differs — but the catalog it is intersected with does not. A plan lock or a
    // node's feature switch binds an app exactly as it binds a person.
    const isApp = isApiBucket(bucket);
    const grants = request.sessionInfo?.appPermissions ?? {};

    // A specific permission subsumes the feature switch — an enabled permission implies its feature is unlocked
    if (requiredPermission) {
      const enabled = await this.primaryDb.runWithRlsContext({ orgId }, () =>
        isApp
          ? this.userPermissionsService.resolveAppEnabledPermissions(grants, ctx, bucket)
          : this.userPermissionsService.resolveEnabledPermissions(userId, ctx, bucket),
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
        isApp
          ? this.userPermissionsService.resolveAppAvailableFeatures(grants, ctx, bucket)
          : this.userPermissionsService.resolveAvailableFeatures(userId, ctx, bucket),
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
