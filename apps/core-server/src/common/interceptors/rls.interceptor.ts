import { type CallHandler, type ExecutionContext, Injectable, Logger, type NestInterceptor } from '@nestjs/common';
import { PrimaryDatabaseService } from '@vritti/api-sdk';
import type { FastifyRequest } from 'fastify';
import { from, type Observable } from 'rxjs';

// Sets app.org_id in AsyncLocalStorage for every authenticated HTTP request so RLS
// org_isolation policies apply to the session's organization. Skips unauthenticated
// requests (no sessionInfo) so auth/health endpoints are unaffected.
@Injectable()
export class RlsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RlsInterceptor.name);

  constructor(private readonly db: PrimaryDatabaseService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const orgId = request.sessionInfo?.organizationId;

    if (!orgId) {
      return next.handle();
    }

    return from(this.db.runWithRlsContext({ orgId }, async () => next.handle().toPromise()));
  }
}
