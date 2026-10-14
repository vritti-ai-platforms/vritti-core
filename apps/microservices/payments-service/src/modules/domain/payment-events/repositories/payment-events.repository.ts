import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, eq, inArray } from '@vritti/api-sdk/drizzle-orm';
import { type PaymentEvent, PaymentEventStatusValues, paymentEvents } from '@/db/schema';

@Injectable()
export class PaymentEventsDomainRepository extends PrimaryBaseRepository<typeof paymentEvents> {
  constructor(database: PrimaryDatabaseService) {
    super(database, paymentEvents);
  }

  // The organization's events core has not acknowledged yet, oldest first; RLS scopes them to the organization
  async findPending(limit: number): Promise<PaymentEvent[]> {
    return (await this.db
      .select()
      .from(paymentEvents)
      .where(eq(paymentEvents.status, PaymentEventStatusValues.PENDING))
      .orderBy(asc(paymentEvents.createdAt))
      .limit(limit)) as PaymentEvent[];
  }

  // Marks events core has dispatched; ids outside the organization are invisible to RLS and simply not touched
  async ack(ids: string[], at: Date): Promise<number> {
    if (ids.length === 0) return 0;
    const rows = await this.db
      .update(paymentEvents)
      .set({ status: PaymentEventStatusValues.ACKED, ackedAt: at })
      .where(and(inArray(paymentEvents.id, ids), eq(paymentEvents.status, PaymentEventStatusValues.PENDING)))
      .returning({ id: paymentEvents.id });
    return rows.length;
  }
}
