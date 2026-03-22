export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED';

export interface InvoiceLineItem {
  name: string;
  quantity: number;
  unitPrice: string;
  total: string;
}

export interface Invoice {
  id: string;
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
}
