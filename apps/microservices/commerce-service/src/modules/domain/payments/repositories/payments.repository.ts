import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { eq } from '@vritti/api-sdk/drizzle-orm';
import { type Payment, payments } from '@/db/schema';

@Injectable()
export class PaymentsRepository extends PrimaryBaseRepository<typeof payments> {
  constructor(database: PrimaryDatabaseService) {
    super(database, payments);
  }

  // Returns all payments for an invoice
  async findByInvoiceId(invoiceId: string): Promise<Payment[]> {
    return this.db.select().from(payments).where(eq(payments.invoiceId, invoiceId));
  }
}
