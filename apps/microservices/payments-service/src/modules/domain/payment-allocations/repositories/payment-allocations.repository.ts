import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { type NewPaymentAllocation, type PaymentAllocation, paymentAllocations } from '@/db/schema';

@Injectable()
export class PaymentAllocationsDomainRepository extends PrimaryBaseRepository<typeof paymentAllocations> {
  constructor(database: PrimaryDatabaseService) {
    super(database, paymentAllocations);
  }

  // Inserts every store's share of an intent in one statement
  async createMany(rows: NewPaymentAllocation[]): Promise<PaymentAllocation[]> {
    if (rows.length === 0) return [];
    return this.db.insert(paymentAllocations).values(rows).returning() as Promise<PaymentAllocation[]>;
  }
}
