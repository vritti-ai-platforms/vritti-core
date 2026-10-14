import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, eq, inArray, isNull } from '@vritti/api-sdk/drizzle-orm';
import {
  type NewPaymentTransfer,
  type PaymentTransfer,
  type PaymentTransferStatus,
  paymentIntents,
  paymentTransfers,
} from '@/db/schema';

@Injectable()
export class PaymentTransfersDomainRepository extends PrimaryBaseRepository<typeof paymentTransfers> {
  constructor(database: PrimaryDatabaseService) {
    super(database, paymentTransfers);
  }

  // Inserts every split leg of an intent in one statement
  async createMany(rows: NewPaymentTransfer[]): Promise<PaymentTransfer[]> {
    return this.db.insert(paymentTransfers).values(rows).returning() as Promise<PaymentTransfer[]>;
  }

  // The webhook correlation key — a transfer event names the gateway's transfer, not our row
  async findByProviderTransferId(providerTransferId: string): Promise<PaymentTransfer | undefined> {
    return this.model.findFirst({
      where: { providerTransferId },
    });
  }

  // Updates the row a gateway transfer id points at, but only while its status is one of `from` — a single
  // statement, so a late event can never move a transfer backwards over one applied concurrently. Undefined when
  // no row carries the id or its status is not one the update may leave
  async updateByProviderTransferIdFrom(
    providerTransferId: string,
    from: PaymentTransferStatus[],
    data: Partial<NewPaymentTransfer>,
  ): Promise<PaymentTransfer | undefined> {
    if (from.length === 0) return undefined;
    const [row] = (await this.db
      .update(paymentTransfers)
      .set(data)
      .where(and(eq(paymentTransfers.providerTransferId, providerTransferId), inArray(paymentTransfers.status, from)))
      .returning()) as PaymentTransfer[];
    return row;
  }

  // A leg of the intent that took this gateway payment, for this account, whose send has not been stamped yet —
  // a transfer event that names it arrived before the send that created it committed
  async findUnstampedByPaymentAndAccount(
    providerPaymentId: string,
    providerAccountId: string,
  ): Promise<PaymentTransfer | undefined> {
    const [row] = await this.db
      .select({ transfer: paymentTransfers })
      .from(paymentTransfers)
      .innerJoin(paymentIntents, eq(paymentIntents.id, paymentTransfers.intentId))
      .where(
        and(
          eq(paymentIntents.providerPaymentId, providerPaymentId),
          eq(paymentTransfers.providerAccountId, providerAccountId),
          isNull(paymentTransfers.providerTransferId),
        ),
      )
      .limit(1);
    return row?.transfer as PaymentTransfer | undefined;
  }

  // The split legs recorded with an intent that have not been sent to the gateway yet. A leg is sent once it
  // carries the gateway's transfer id — its status cannot say so, since the gateway may answer a send with CREATED
  async findUnsentByIntent(intentId: string): Promise<PaymentTransfer[]> {
    return (await this.db
      .select()
      .from(paymentTransfers)
      .where(
        and(eq(paymentTransfers.intentId, intentId), isNull(paymentTransfers.providerTransferId)),
      )) as PaymentTransfer[];
  }
}
