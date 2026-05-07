import { type CallHandler, type ExecutionContext, Injectable, Logger, type NestInterceptor } from '@nestjs/common';
import { BadRequestException, PrimaryDatabaseService } from '@vritti/api-sdk';
import { sql } from '@vritti/api-sdk/drizzle-orm';
import type { FastifyRequest } from 'fastify';
import { from, type Observable } from 'rxjs';

// Wraps a webhook request in a single pinned DB connection and sets `app.org_id` from the
// `x-org-id` header so RLS policies on tenant-scoped tables (business_units, etc.) can scope
// rows to the calling org. Pair with WebhookSecretGuard which validates the webhook secret.
@Injectable()
export class WebhookSessionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(WebhookSessionInterceptor.name);

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

    return from(this.executeWithRls(orgId, next));
  }

  // Sets app.org_id on a pinned connection for the entire request so subsequent repository
  // queries hit the same connection and see the org scope.
  private executeWithRls(orgId: string, next: CallHandler): Promise<unknown> {
    return this.db.runWithPinnedConnection(async () => {
      await this.db.drizzleClient.execute(sql`SELECT set_config('app.org_id', ${orgId}, TRUE)`);
      return await next.handle().toPromise();
    });
  }
}
