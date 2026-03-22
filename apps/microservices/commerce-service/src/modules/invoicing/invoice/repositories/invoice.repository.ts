import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { and, eq, sql } from '@vritti/api-sdk/drizzle-orm';
import { type Invoice, invoices } from '@/db/schema';

@Injectable()
export class InvoiceRepository extends PrimaryBaseRepository<typeof invoices> {
  constructor(database: PrimaryDatabaseService) {
    super(database, invoices);
  }

  // Finds invoices for an org+bu ordered by creation date
  async findByOrgAndBu(orgId: string, buId: string): Promise<Invoice[]> {
    return this.model.findMany({
      where: { organizationId: orgId, businessUnitId: buId },
    });
  }

  // Finds an existing invoice for an order
  async findByOrderId(orderId: string): Promise<Invoice | undefined> {
    return this.model.findFirst({
      where: { orderId },
    });
  }

  // Generates a sequential invoice number for an org+bu
  async generateInvoiceNumber(orgId: string, buId: string): Promise<string> {
    const count = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(invoices)
      .where(and(eq(invoices.organizationId, orgId), eq(invoices.businessUnitId, buId)));
    return `INV-${String(Number(count[0]?.count ?? 0) + 1).padStart(4, '0')}`;
  }
}
