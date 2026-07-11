import { type CallHandler, type ExecutionContext, Injectable, type NestInterceptor } from '@nestjs/common';
import { getRequestFromContext } from '@vritti/api-sdk/context';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { from, type Observable } from 'rxjs';

@Injectable()
export class RlsInterceptor implements NestInterceptor {
  constructor(private readonly db: PrimaryDatabaseService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = getRequestFromContext(context);
    const sessionInfo = request?.sessionInfo;
    const orgId = sessionInfo?.organizationId;

    if (!orgId) {
      return next.handle();
    }

    // Pass the narrow workspace context through so scope-level RLS policies can see it
    const rlsContext = {
      orgId,
      siteId: sessionInfo?.siteId,
      siteGroupId: sessionInfo?.siteGroupId,
      legalEntityId: sessionInfo?.legalEntityId,
    };

    return from(this.db.runWithRlsContext(rlsContext, async () => next.handle().toPromise()));
  }
}
