import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { type NewPaymentAttempt, type PaymentAttempt, paymentAttempts } from '@/db/schema';

@Injectable()
export class PaymentAttemptsDomainRepository extends PrimaryBaseRepository<typeof paymentAttempts> {
  constructor(database: PrimaryDatabaseService) {
    super(database, paymentAttempts);
  }

  // The attempt a gateway payment id belongs to, within one intent
  async findByProviderPayment(intentId: string, providerPaymentId: string): Promise<PaymentAttempt | undefined> {
    return this.model.findFirst({ where: { intentId, providerPaymentId } });
  }

  // Records the latest state of one gateway payment against its intent — one row per payment id, updated as the
  // gateway reports it authorized, captured or failed
  async upsertByProviderPayment(data: NewPaymentAttempt & { providerPaymentId: string }): Promise<PaymentAttempt> {
    const existing = await this.findByProviderPayment(data.intentId, data.providerPaymentId);
    if (!existing) return this.create(data);
    return this.update(existing.id, {
      status: data.status,
      method: data.method ?? existing.method,
      errorCode: data.errorCode ?? null,
      errorMessage: data.errorMessage ?? null,
      raw: data.raw ?? existing.raw,
    });
  }
}
