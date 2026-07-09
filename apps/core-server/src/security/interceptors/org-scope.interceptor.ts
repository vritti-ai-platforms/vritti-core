import { type CallHandler, type ExecutionContext, Injectable, type NestInterceptor } from '@nestjs/common';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import type { FastifyRequest } from 'fastify';
import { from, type Observable } from 'rxjs';

@Injectable()
export class OrgScopeInterceptor implements NestInterceptor {
  constructor(private readonly db: PrimaryDatabaseService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const orgIdHeader = request.headers['x-org-id'];
    const orgId = Array.isArray(orgIdHeader) ? orgIdHeader[0] : orgIdHeader;

    if (!orgId) {
      throw new BadRequestException({
        label: 'Missing Org Header',
        detail: 'Internal requests must include the x-org-id header.',
      });
    }

    return from(this.db.runWithRlsContext({ orgId }, async () => next.handle().toPromise()));
  }
}
