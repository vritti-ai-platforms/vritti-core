import type { Invoice, InvoiceLineItem } from '@/db/schema';

export class InvoiceDto {
  id: string;
  organizationId: string;
  businessUnitId: string;
  orderId: string;
  invoiceNumber: string;
  customerId: string | null;
  customerPhone: string | null;
  customerName: string | null;
  items: InvoiceLineItem[];
  subtotal: string;
  tax: string;
  discount: string;
  total: string;
  status: string;
  issuedAt: string | null;
  paidAt: string | null;
  createdAt: string;

  // Creates a DTO from an Invoice entity
  static from(invoice: Invoice): InvoiceDto {
    const dto = new InvoiceDto();
    dto.id = invoice.id;
    dto.organizationId = invoice.organizationId;
    dto.businessUnitId = invoice.businessUnitId;
    dto.orderId = invoice.orderId;
    dto.invoiceNumber = invoice.invoiceNumber;
    dto.customerId = invoice.customerId ?? null;
    dto.customerPhone = invoice.customerPhone ?? null;
    dto.customerName = invoice.customerName ?? null;
    dto.items = invoice.items;
    dto.subtotal = invoice.subtotal;
    dto.tax = invoice.tax;
    dto.discount = invoice.discount;
    dto.total = invoice.total;
    dto.status = invoice.status;
    dto.issuedAt = invoice.issuedAt ? invoice.issuedAt.toISOString() : null;
    dto.paidAt = invoice.paidAt ? invoice.paidAt.toISOString() : null;
    dto.createdAt = invoice.createdAt.toISOString();
    return dto;
  }
}
