import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z } from '@vritti/quantum-ui/zod';

// Meta ids are numeric strings, not Vritti entity codes, so zodCodeField() does not apply.
// Mirrors CreateWhatsappAccountDto on the gateway.
export const connectWhatsappAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be at most 255 characters'),
  metaBusinessId: z
    .string()
    .min(1, 'Business portfolio ID is required')
    .max(64, 'Business portfolio ID must be at most 64 characters')
    .regex(/^\d+$/, 'Numbers only'),
  wabaId: z
    .string()
    .min(1, 'WABA ID is required')
    .max(64, 'WABA ID must be at most 64 characters')
    .regex(/^\d+$/, 'Numbers only'),
  accessToken: z.string().min(1, 'Access token is required'),
  isDefault: z.boolean(),
});

export type ConnectWhatsappAccountFormData = z.infer<typeof connectWhatsappAccountSchema>;

export interface WhatsappAccountData {
  id: string;
  legalEntityId: string | null;
  metaBusinessId: string;
  wabaId: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type WhatsappAccountsTableResponse = TableResponse<WhatsappAccountData>;

export interface CreateWhatsappAccountData {
  legalEntityId?: string | null;
  metaBusinessId: string;
  wabaId: string;
  name: string;
  accessToken: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface UpdateWhatsappAccountData {
  legalEntityId?: string | null;
  name?: string;
  accessToken?: string;
  isDefault?: boolean;
  isActive?: boolean;
}
