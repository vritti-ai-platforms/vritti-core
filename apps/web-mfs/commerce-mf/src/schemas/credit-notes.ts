import { z, zodNumericField } from '@vritti/quantum-ui/zod';

// Money fields below are bigint minor units serialized as strings — feed straight into
// formatCurrency() / minorToMajor(). For arithmetic, parse with BigInt(...).
export interface CreditNoteApplicationData {
  id: string;
  creditNoteId: string;
  invoiceId: string;
  amount: string;
  appliedAt: string;
}

export interface CreditNoteData {
  id: string;
  type: string;
  partyType: string;
  partyId: string | null;
  partyName: string;
  creditNoteNumber: string;
  amount: string;
  appliedAmount: string;
  remaining: string;
  reason: string;
  status: string;
  issuedBy: string | null;
  createdAt: string;
}

export interface CreditNoteDetail extends CreditNoteData {
  applications: CreditNoteApplicationData[];
}

export const createCreditNoteSchema = z.object({
  type: z.enum(['PAYABLE', 'RECEIVABLE'], { message: 'Type is required' }),
  partyType: z.enum(['SUPPLIER', 'CUSTOMER', 'AGGREGATOR'], { message: 'Party type is required' }),
  partyName: z.string().min(1, 'Party name is required'),
  creditNoteNumber: z.string().min(1, 'Credit note number is required'),
  amount: zodNumericField({ required: 'Amount is required', positive: true }),
  reason: z.string().min(1, 'Reason is required'),
});

export type CreateCreditNoteFormData = z.infer<typeof createCreditNoteSchema>;

export const applyCreditNoteSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  amount: zodNumericField({ required: 'Amount is required', positive: true }),
});

export type ApplyCreditNoteFormData = z.infer<typeof applyCreditNoteSchema>;
