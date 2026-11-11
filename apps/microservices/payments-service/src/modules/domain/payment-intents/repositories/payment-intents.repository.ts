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
  // The intent a gateway payment paid — how a refund event finds what it refunds
  async findByProviderPaymentId(providerPaymentId: string): Promise<PaymentIntent | undefined> {
    return this.model.findFirst({ where: { providerPaymentId } });
  }

  // Refunds the gateway has accepted but not yet confirmed, oldest first
  async findRefundPending(limit: number): Promise<PaymentIntent[]> {
    return this.model.findMany({ where: { status: 'REFUND_PENDING' }, orderBy: { updatedAt: 'asc' }, limit });
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<PaymentIntent | undefined> {
    return this.model.findFirst({ where: { idempotencyKey } });
  }

  // Every intent opened for a target, newest first; RLS scopes it to the organization
  async findByTarget(targetId: string): Promise<PaymentIntent[]> {
    return this.model.findMany({ where: { targetId }, orderBy: { createdAt: 'desc' } });
  }

  // The intents opened for one thing being paid for, newest first
  async findByReference(referenceType: string, referenceId: string): Promise<PaymentIntent[]> {
    return this.model.findMany({ where: { referenceType, referenceId }, orderBy: { createdAt: 'desc' } });
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
