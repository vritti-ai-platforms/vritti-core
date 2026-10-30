import { type CallHandler, type ExecutionContext, Injectable, Logger, type NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { ForbiddenException } from '@vritti/api-sdk/exceptions';
import type { Observable } from 'rxjs';
import { UserPermissionsDomainService } from '@/modules/domain/user-permissions/services/user-permissions.service';
import { getRequest } from '@/utils/request-context';
import { REQUIRE_FEATURE_KEY, SKIP_FEATURE_KEY } from '../decorators/require-feature.decorator';
import { REQUIRE_PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { triggeredFieldGates } from '../field-gates';
import { resolvePermissionCaller } from '../permission-caller';

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
    const fieldGates = triggeredFieldGates(context);
    if (!requiredPermission && !requiredFeature && fieldGates.length === 0) return next.handle();

    const auth = request.auth;
    this.logger.debug(
      `  auth: kind=${auth?.kind} siteId=${auth?.siteId} siteGroupId=${auth?.siteGroupId} legalEntityId=${auth?.legalEntityId} orgId=${auth?.organizationId}`,
    );

    const caller = resolvePermissionCaller(auth);
    if (!caller) {
      this.logger.warn(`  DENY — no grant-bearing principal (kind=${auth?.kind ?? 'none'})`);
      throw new ForbiddenException('You do not have permission to perform this action.');
    }
    const { orgId, ctx, bucket, source } = caller;

    if (requiredPermission || fieldGates.length > 0) {
      const enabled = await this.primaryDb.runWithRlsContext({ orgId }, () =>
        this.userPermissionsService.resolveEnabledPermissions(source, ctx, bucket),
      );
      if (requiredPermission && !enabled.has(requiredPermission)) {
        this.logger.warn(`  DENY ${requiredPermission} — not in enabled set`);
        throw new ForbiddenException('You do not have permission to perform this action.');
      }
      for (const gate of fieldGates) {
        const missing = gate.codes.filter((code) => !enabled.has(code));
        if (missing.length > 0) {
          this.logger.warn(`  DENY field "${gate.field}" — missing ${missing.join(', ')}`);
          throw new ForbiddenException({
            label: 'Not Allowed',
            detail: `You do not have permission to set "${gate.field}".`,
          });
        }
      }
      // A specific permission subsumes the feature switch — an enabled permission implies its feature is unlocked
      if (requiredPermission) {
        this.logger.debug(`  ALLOW ${requiredPermission}`);
        return next.handle();
      }
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
