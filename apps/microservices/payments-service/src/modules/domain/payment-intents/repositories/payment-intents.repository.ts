import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, eq, inArray, lt } from '@vritti/api-sdk/drizzle-orm';
import { type PaymentIntent, type PaymentIntentStatus, paymentIntents } from '@/db/schema';

@Injectable()
export class PaymentIntentsDomainRepository extends PrimaryBaseRepository<typeof paymentIntents> {
  constructor(database: PrimaryDatabaseService) {
    super(database, paymentIntents);
  }

  // The webhook correlation key — a gateway event names its order, not our intent
  async findByProviderOrderId(providerOrderId: string): Promise<PaymentIntent | undefined> {
    return this.model.findFirst({ where: { providerOrderId } });
  }

  // The intent a caller already opened under this idempotency key; RLS scopes it to the organization
  async findByIdempotencyKey(idempotencyKey: string): Promise<PaymentIntent | undefined> {
    return this.model.findFirst({ where: { idempotencyKey } });
  }

  // Reads the intent and holds its row until the surrounding transaction ends, so two completions of the same
  // payment (the browser's confirm and the gateway's webhook) cannot both act on the status they read
  async lockById(id: string): Promise<PaymentIntent | undefined> {
    const [row] = (await this.db
      .select()
      .from(paymentIntents)
      .where(eq(paymentIntents.id, id))
      .for('update')) as PaymentIntent[];
    return row;
  }

  // Intents still waiting on the customer whose expiry has passed
  async findExpirable(now: Date, statuses: PaymentIntentStatus[], limit: number): Promise<PaymentIntent[]> {
    return (await this.db
      .select()
      .from(paymentIntents)
      .where(and(inArray(paymentIntents.status, statuses), lt(paymentIntents.expiresAt, now)))
      .limit(limit)) as PaymentIntent[];
  }
}
