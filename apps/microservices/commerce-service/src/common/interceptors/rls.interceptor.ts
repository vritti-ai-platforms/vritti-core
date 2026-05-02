import { type CallHandler, type ExecutionContext, Injectable, Logger, type NestInterceptor } from '@nestjs/common';
import { NatsContext } from '@nestjs/microservices';
import type { NatsHeaders } from '@vritti/api-sdk';
import { PrimaryDatabaseService, parseNatsHeaders } from '@vritti/api-sdk';
import { sql } from '@vritti/api-sdk/drizzle-orm';
import { from, type Observable } from 'rxjs';

@Injectable()
export class RlsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RlsInterceptor.name);

  constructor(private readonly db: PrimaryDatabaseService) {}

  // Extracts NatsHeaders from NATS message headers and sets PostgreSQL session variables for RLS
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const rpcContext = context.switchToRpc().getContext<NatsContext>();
    const rawHeaders = rpcContext?.getHeaders?.();

    const natsHeaders = parseNatsHeaders(rawHeaders);

    if (!natsHeaders) {
      this.logger.warn('No NATS headers found — skipping RLS. Request will use DB defaults.');
      return next.handle();
    }

    return from(this.executeWithRls(natsHeaders, next));
  }

  // Sets RLS session variables on a single pinned connection for the entire request,
  // so subsequent repository queries hit the same connection and see app.org_id / app.bu_id.
  private executeWithRls(headers: NatsHeaders, next: CallHandler): Promise<unknown> {
    return this.db.runWithPinnedConnection(async () => {
      const client = this.db.drizzleClient;
      await client.execute(sql`
        SELECT set_config('app.org_id', ${headers.orgId}, TRUE),
               set_config('app.bu_id', ${headers.buId}, TRUE),
               set_config('app.bu_timezone', ${headers.buTimezone}, TRUE),
               set_config('app.bu_ancestor_ids', ${`{${headers.buAncestorIds.join(',')}}`}, TRUE),
               set_config('app.bu_descendant_ids', ${`{${headers.buDescendantIds.join(',')}}`}, TRUE)
      `);
      return await next.handle().toPromise();
    });
  }
}
