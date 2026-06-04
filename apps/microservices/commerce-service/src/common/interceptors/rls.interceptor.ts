import { type CallHandler, type ExecutionContext, Injectable, Logger, type NestInterceptor } from '@nestjs/common';
import { NatsContext } from '@nestjs/microservices';
import { type NatsHeaders, PrimaryDatabaseService, parseNatsHeaders } from '@vritti/api-sdk';
import { from, type Observable } from 'rxjs';

@Injectable()
export class RlsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RlsInterceptor.name);

  constructor(private readonly db: PrimaryDatabaseService) {}

  // Extracts NatsHeaders and stashes them in AsyncLocalStorage so each downstream query
  // can be auto-wrapped in BEGIN; SET LOCAL app.* ; <query>; COMMIT; by RlsAwarePool.
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

  private executeWithRls(headers: NatsHeaders, next: CallHandler): Promise<unknown> {
    return this.db.runWithRlsContext(headers, async () => next.handle().toPromise());
  }
}
