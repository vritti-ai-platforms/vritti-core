import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z, zodNumericField } from '@vritti/quantum-ui/zod';

export type InvoiceType = 'PAYABLE' | 'RECEIVABLE';
export type InvoicePartyType = 'SUPPLIER' | 'CUSTOMER' | 'AGGREGATOR';
export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'VOID';

export interface InvoiceItemData {
  id: string;
  description: string;
  quantity: number;
  unitPrice: string;
  taxAmount: string;
  total: string;
  referenceItemId: string | null;
}

export interface InvoiceData {
  id: string;
  type: InvoiceType;
  invoiceNumber: string;
  partyType: InvoicePartyType;
  partyId: string | null;
  partyName: string;
  referenceType: string | null;
  referenceId: string | null;
  subtotal: string;
  taxAmount: string;
  discountAmount: string;
  totalAmount: string;
  paidAmount: string;
  balance: string;
  status: InvoiceStatus;
  paymentTerms: string | null;
  issuedDate: string;
  dueDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceDetail extends InvoiceData {
  items: InvoiceItemData[];
}

export type InvoicesTableResponse = TableResponse<InvoiceData>;

export interface PaymentData {
  id: string;
  invoiceId: string;
  amount: string;
  method: string;
  reference: string | null;
  status: string;
  paidAt: string;
  notes: string | null;
  createdAt: string;
}

export const createInvoiceSchema = z.object({
  type: z.enum(['PAYABLE', 'RECEIVABLE'], { message: 'Type is required' }),
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  partyType: z.enum(['SUPPLIER', 'CUSTOMER', 'AGGREGATOR'], { message: 'Party type is required' }),
  partyName: z.string().min(1, 'Party name is required'),
  issuedDate: z.string().min(1, 'Issued date is required'),
  dueDate: z.string().nullable().optional(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateInvoiceFormData = z.infer<typeof createInvoiceSchema>;

export const createPaymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice is required'),
  amount: zodNumericField({ required: 'Amount is required', positive: true }),
  method: z.enum(['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'WALLET', 'ONLINE'], { message: 'Method is required' }),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export type CreatePaymentFormData = z.infer<typeof createPaymentSchema>;
