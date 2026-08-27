import { type CallHandler, type ExecutionContext, Injectable, type NestInterceptor } from '@nestjs/common';
import { getRequestFromContext } from '@vritti/api-sdk/context';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { from, type Observable } from 'rxjs';
import { SiteContextResolverService } from '@/site-context/site-context-resolver.service';

@Injectable()
export class RlsInterceptor implements NestInterceptor {
  constructor(
    private readonly db: PrimaryDatabaseService,
    private readonly siteContextResolver: SiteContextResolverService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = getRequestFromContext(context);
    const auth = request?.auth;
    const orgId = auth?.organizationId;

    if (!orgId) {
      return next.handle();
    }

    return from(this.executeWithRls(orgId, auth, next));
  }

  // Builds the workspace RLS context — a site workspace derives its legal entity so LE policies apply there too
  private async executeWithRls(
    orgId: string,
    auth: { siteId?: string; siteGroupId?: string; legalEntityId?: string } | undefined,
    next: CallHandler,
  ): Promise<unknown> {
    const siteId = auth?.siteId;
    let legalEntityId = auth?.legalEntityId;

    if (siteId && !legalEntityId) {
      // The site lookup itself needs the org RLS context — without it the org-isolation policy hides the site
      const siteContext = await this.db.runWithRlsContext({ orgId }, () => this.siteContextResolver.resolve(siteId));
      legalEntityId = siteContext.legalEntityId || undefined;
    }

    const rlsContext = {
      orgId,
      siteId,
      siteGroupId: auth?.siteGroupId,
      legalEntityId,
    };

    return this.db.runWithRlsContext(rlsContext, async () => next.handle().toPromise());
  }
}
