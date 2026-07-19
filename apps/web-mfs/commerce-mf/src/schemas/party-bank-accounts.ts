import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z } from '@vritti/quantum-ui/zod';

export const partyBankAccountSchema = z.object({
  accountName: z.string().min(1, 'Account name is required').max(255),
  accountNumber: z.string().min(1, 'Account number is required').max(50),
  ifscCode: z.string().max(20).optional(),
  upiId: z.string().max(100).optional(),
  bankName: z.string().max(255).optional(),
  isPrimary: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export type PartyBankAccountFormData = z.infer<typeof partyBankAccountSchema>;

export interface PartyBankAccountPayload {
  accountName: string;
  accountNumber: string;
  ifscCode?: string | null;
  upiId?: string | null;
  bankName?: string | null;
  isPrimary?: boolean;
  isActive?: boolean;
}

export interface PartyBankAccountRow {
  id: string;
  partyId: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string | null;
  upiId: string | null;
  bankName: string | null;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
}

export type PartyBankAccountsTableResponse = TableResponse<PartyBankAccountRow>;
