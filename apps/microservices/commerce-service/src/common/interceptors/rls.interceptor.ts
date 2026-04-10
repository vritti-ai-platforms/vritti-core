import { type CallHandler, type ExecutionContext, Injectable, Logger, type NestInterceptor } from '@nestjs/common';
import { NatsContext } from '@nestjs/microservices';
import type { NatsHeaders } from '@vritti/api-sdk';
import { PrimaryDatabaseService, parseNatsHeaders } from '@vritti/api-sdk';
import { sql } from '@vritti/api-sdk/drizzle-orm';
import { from, type Observable, switchMap } from 'rxjs';

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

    return from(this.executeWithRls(natsHeaders, next)).pipe(switchMap((result) => [result]));
  }

  // Sets RLS session variables, executes the handler, then resets variables
  private async executeWithRls(headers: NatsHeaders, next: CallHandler): Promise<unknown> {
    const client = this.db.drizzleClient;

    try {
      await client.execute(sql`
        SELECT set_config('app.org_id', ${headers.orgId}, FALSE),
               set_config('app.bu_id', ${headers.buId}, FALSE),
               set_config('app.bu_ancestor_ids', ${`{${headers.buAncestorIds.join(',')}}`}, FALSE),
               set_config('app.bu_descendant_ids', ${`{${headers.buDescendantIds.join(',')}}`}, FALSE)
      `);

      return await next.handle().toPromise();
    } finally {
      await client.execute(sql`
        SELECT set_config('app.org_id', '', FALSE),
               set_config('app.bu_id', '', FALSE),
               set_config('app.bu_ancestor_ids', '{}', FALSE),
               set_config('app.bu_descendant_ids', '{}', FALSE)
      `);
    }
  }
}
