import { type CallHandler, type ExecutionContext, Injectable, Logger, type NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ForbiddenException, PrimaryDatabaseService } from '@vritti/api-sdk';
import type { PlatformBucket } from '@vritti/api-sdk/catalog-resolver';
import type { Observable } from 'rxjs';
import { SessionTypeValues } from '@/db/schema';
import { UserPermissionsService } from '@/modules/domain/user-permissions/services/user-permissions.service';
import { getRequest } from '@/utils/request-context';
import { REQUIRE_FEATURE_KEY, SKIP_FEATURE_KEY } from '../decorators/require-feature.decorator';
import { REQUIRE_PERMISSION_KEY } from '../decorators/require-permission.decorator';

@Injectable()
export class PermissionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PermissionInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly userPermissionsService: UserPermissionsService,
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
    const buId = request.sessionInfo?.buId;
    const orgId = request.sessionInfo?.organizationId;
    const sessionType = request.sessionInfo?.sessionType;
    this.logger.debug(`  session: userId=${userId} buId=${buId} orgId=${orgId} sessionType=${sessionType}`);
    if (!userId || !buId || !orgId) {
      this.logger.warn('  DENY — missing session context (userId/buId/orgId)');
      throw new ForbiddenException('You do not have permission to perform this action.');
    }

    // Platform bucket follows the session type: a MOBILE session enforces the mobile feature set, all else web
    const bucket: PlatformBucket = sessionType === SessionTypeValues.MOBILE ? 'mobile' : 'web';

    // A specific permission subsumes the feature switch — an enabled permission implies its feature is unlocked
    if (requiredPermission) {
      const enabled = await this.primaryDb.runWithRlsContext({ orgId }, () =>
        this.userPermissionsService.resolveEnabledPermissions(userId, buId, bucket),
      );
      if (!enabled.has(requiredPermission)) {
        this.logger.warn(`  DENY ${requiredPermission} — not in enabled set`);
        throw new ForbiddenException('You do not have permission to perform this action.');
      }
      this.logger.debug(`  ALLOW ${requiredPermission}`);
      return next.handle();
    }

    // No specific permission (e.g. count) — gate on the feature switch being on for this user's BU
    if (requiredFeature) {
      const available = await this.primaryDb.runWithRlsContext({ orgId }, () =>
        this.userPermissionsService.resolveAvailableFeatures(userId, buId, bucket),
      );
      if (!available.has(requiredFeature)) {
        this.logger.warn(`  DENY feature ${requiredFeature} — switch off / not available`);
        throw new ForbiddenException('This feature is not available for your business unit.');
      }
      this.logger.debug(`  ALLOW feature ${requiredFeature}`);
    }
    return next.handle();
  }
}
