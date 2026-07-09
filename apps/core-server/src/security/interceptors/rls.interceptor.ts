import { type CallHandler, type ExecutionContext, Injectable, type NestInterceptor } from '@nestjs/common';
import { getRequestFromContext } from '@vritti/api-sdk/context';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { from, type Observable } from 'rxjs';

@Injectable()
export class RlsInterceptor implements NestInterceptor {
  constructor(private readonly db: PrimaryDatabaseService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = getRequestFromContext(context);
    const orgId = request?.sessionInfo?.organizationId;

    if (!orgId) {
      return next.handle();
    }

    return from(this.db.runWithRlsContext({ orgId }, async () => next.handle().toPromise()));
  }
}
