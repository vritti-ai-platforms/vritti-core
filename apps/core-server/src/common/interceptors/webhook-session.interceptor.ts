import { type CallHandler, type ExecutionContext, Injectable, type NestInterceptor } from '@nestjs/common';
import { BadRequestException, PrimaryDatabaseService } from '@vritti/api-sdk';
import type { FastifyRequest } from 'fastify';
import { from, type Observable } from 'rxjs';

// Stashes { orgId } from the `x-org-id` header in AsyncLocalStorage so RLS policies on
// tenant-scoped tables can scope to the calling org. Each downstream query is auto-wrapped
// in BEGIN; SET LOCAL app.org_id; <query>; COMMIT; by RlsAwarePool. Pair with WebhookSecretGuard.
@Injectable()
export class WebhookSessionInterceptor implements NestInterceptor {

  constructor(private readonly db: PrimaryDatabaseService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const orgIdHeader = request.headers['x-org-id'];
    const orgId = Array.isArray(orgIdHeader) ? orgIdHeader[0] : orgIdHeader;

    if (!orgId) {
      throw new BadRequestException({
        label: 'Missing Org Header',
        detail: 'Webhook requests must include the x-org-id header.',
      });
    }

    return from(this.db.runWithRlsContext({ orgId }, async () => next.handle().toPromise()));
  }
}
