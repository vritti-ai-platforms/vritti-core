import { type CallHandler, type ExecutionContext, Injectable, Logger, type NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ForbiddenException, PrimaryDatabaseService } from '@vritti/api-sdk';
import type { PlatformBucket } from '@vritti/api-sdk/catalog-resolver';
import type { Observable } from 'rxjs';
import { SessionTypeValues } from '@/db/schema';
import { UserPermissionsService } from '@/modules/domain/user-permissions/services/user-permissions.service';
import { getRequest } from '@/utils/request-context';
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
    const required = this.reflector.getAllAndOverride<string | undefined>(REQUIRE_PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    this.logger.debug(`→ ${request.method} ${request.url} | required=${required ?? 'NONE (skip)'}`);
    if (!required) return next.handle();

    const userId = request.sessionInfo?.userId;
    const buId = request.sessionInfo?.buId;
    const orgId = request.sessionInfo?.organizationId;
    const sessionType = request.sessionInfo?.sessionType;
    this.logger.debug(`  session: userId=${userId} buId=${buId} orgId=${orgId} sessionType=${sessionType}`);
    if (!userId || !buId || !orgId) {
      this.logger.warn(`  DENY ${required} — missing session context (userId/buId/orgId)`);
      throw new ForbiddenException('You do not have permission to perform this action.');
    }

    // Platform bucket follows the session type: a MOBILE session enforces the mobile feature set, all else web
    const bucket: PlatformBucket = sessionType === SessionTypeValues.MOBILE ? 'mobile' : 'web';

    // Resolution reads RLS-protected tables; establish the org context so org_isolation sees app.org_id
    const enabled = await this.primaryDb.runWithRlsContext({ orgId }, () =>
      this.userPermissionsService.resolveEnabledPermissions(userId, buId, bucket),
    );
    this.logger.debug(`  bucket=${bucket} enabled(${enabled.size})=[${[...enabled].sort().join(', ')}]`);

    if (!enabled.has(required)) {
      this.logger.warn(`  DENY ${required} — not in enabled set`);
      throw new ForbiddenException('You do not have permission to perform this action.');
    }

    this.logger.debug(`  ALLOW ${required}`);
    return next.handle();
  }
}
