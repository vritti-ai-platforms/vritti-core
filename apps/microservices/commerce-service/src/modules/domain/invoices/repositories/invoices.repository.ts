import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { eq } from '@vritti/api-sdk/drizzle-orm';
import { type InvoiceItem, invoiceItems, invoices, type NewInvoiceItem } from '@/db/schema';

@Injectable()
export class InvoicesRepository extends PrimaryBaseRepository<typeof invoices> {
  constructor(database: PrimaryDatabaseService) {
    super(database, invoices);
  }

  // Returns all line items for an invoice
  async findItemsByInvoiceId(invoiceId: string): Promise<InvoiceItem[]> {
    return this.db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  }

  // Creates multiple invoice line items
  async createItems(items: NewInvoiceItem[]): Promise<InvoiceItem[]> {
    if (items.length === 0) return [];
    return this.db.insert(invoiceItems).values(items).returning() as Promise<InvoiceItem[]>;
  }

  // Deletes all line items for an invoice
  async deleteItemsByInvoiceId(invoiceId: string): Promise<void> {
    await this.db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  }
}
