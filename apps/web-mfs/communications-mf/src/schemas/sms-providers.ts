import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z } from '@vritti/quantum-ui/zod';

export const SMS_PROVIDER_CODES = ['CONSOLE', 'MSG91', 'TWILIO'] as const;
export type SmsProviderCode = (typeof SMS_PROVIDER_CODES)[number];

// PLATFORM rows are Vritti-managed senders every org can use (read-only here); CLIENT rows are the org's own
export type SmsProviderType = 'PLATFORM' | 'CLIENT';

// Mirrors SmsProviderResponseDto — credentials never cross the wire, only whether they exist
export interface SmsProviderData {
  id: string;
  type: SmsProviderType;
  provider: SmsProviderCode;
  name: string;
  senderId: string | null;
  isActive: boolean;
  hasCredentials: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SmsProvidersTableResponse = TableResponse<SmsProviderData>;

export interface CreateSmsProviderData {
  provider: SmsProviderCode;
  name: string;
  credentials?: Record<string, unknown>;
  senderId?: string;
}

export interface UpdateSmsProviderData {
  name?: string;
  credentials?: Record<string, unknown>;
  senderId?: string;
  isActive?: boolean;
}

export const SMS_PROVIDER_OPTIONS = [
  { value: 'MSG91', label: 'MSG91', description: 'Auth-key based; DLT sender IDs' },
  { value: 'TWILIO', label: 'Twilio', description: 'Account SID + auth token' },
  { value: 'CONSOLE', label: 'Console (dev)', description: 'Logs codes to the server console — never production' },
];

const providerName = z.string().trim().min(1, 'Name is required').max(255);
const senderId = z.string().max(64).optional();

// One flat field-set for every provider; superRefine enforces the picked provider's required secrets
export const connectSmsProviderSchema = z
  .object({
    provider: z.enum(SMS_PROVIDER_CODES),
    name: providerName,
    senderId,
    authKey: z.string().max(255).optional(),
    accountSid: z.string().max(255).optional(),
    authToken: z.string().max(255).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.provider === 'MSG91' && !data.authKey?.trim()) {
      ctx.addIssue({ code: 'custom', path: ['authKey'], message: 'Auth key is required for MSG91' });
    }
    if (data.provider === 'TWILIO') {
      if (!data.accountSid?.trim()) {
        ctx.addIssue({ code: 'custom', path: ['accountSid'], message: 'Account SID is required for Twilio' });
      }
      if (!data.authToken?.trim()) {
        ctx.addIssue({ code: 'custom', path: ['authToken'], message: 'Auth token is required for Twilio' });
      }
    }
  });

export type ConnectSmsProviderFormData = z.infer<typeof connectSmsProviderSchema>;

// Edit keeps blanks meaning "leave the stored credentials in place"
export const updateSmsProviderSchema = z.object({
  name: providerName,
  senderId,
  authKey: z.string().max(255).optional(),
  accountSid: z.string().max(255).optional(),
  authToken: z.string().max(255).optional(),
});

export type UpdateSmsProviderFormData = z.infer<typeof updateSmsProviderSchema>;

// Maps the flat form fields to the provider's credential shape; undefined = nothing entered
export function buildSmsProviderCredentials(
  provider: SmsProviderCode,
  data: { authKey?: string; accountSid?: string; authToken?: string },
): Record<string, unknown> | undefined {
  if (provider === 'MSG91' && data.authKey?.trim()) return { authKey: data.authKey.trim() };
  if (provider === 'TWILIO' && data.accountSid?.trim() && data.authToken?.trim()) {
    return { accountSid: data.accountSid.trim(), authToken: data.authToken.trim() };
  }
  return undefined;
}
