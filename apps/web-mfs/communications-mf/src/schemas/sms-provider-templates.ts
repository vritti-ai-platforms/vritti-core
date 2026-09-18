import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z } from '@vritti/quantum-ui/zod';

// Mirrors SmsProviderTemplateResponseDto.
//
// Unlike WhatsApp templates — read live from Meta on every load — these rows are stored by Vritti,
// because MSG91 has no endpoint that lists the SMS templates on an account. Each row was confirmed
// with the vendor when it was added, and `details` holds what the vendor returned.
export interface SmsProviderTemplateData {
  id: string;
  providerId: string;
  templateId: string;
  name: string;
  // Opaque vendor payload — MSG91 publishes no schema for it, so it is displayed as it arrived
  // rather than mapped onto fields we would be guessing at
  details: Record<string, unknown>;
  syncedAt: string;
  createdAt: string;
  updatedAt: string;
}

export type SmsProviderTemplatesTableResponse = TableResponse<SmsProviderTemplateData>;

export interface AddSmsProviderTemplateData {
  templateId: string;
  name: string;
}

export const addSmsProviderTemplateSchema = z.object({
  templateId: z.string().trim().min(1, 'Enter the template ID from your MSG91 panel').max(64),
  name: z.string().trim().min(1, 'Name is required').max(255),
});

export type AddSmsProviderTemplateFormData = z.infer<typeof addSmsProviderTemplateSchema>;

// The fields worth showing from a vendor snapshot, once one is recognised.
export interface SmsProviderTemplateDetails {
  templateName?: string;
  body?: string;
  dltId?: string;
  senderId?: string;
  version?: string;
  smsType?: string;
  rejectReason?: string;
}

/**
 * Reads the presentable fields out of a vendor snapshot, or null when the shape is not recognised.
 *
 * `details` is deliberately opaque end to end — every provider returns its own thing — so this is a
 * defensive read rather than a type assertion, and a null result means the caller shows the raw
 * payload instead of pretending to understand it. Today only MSG91's shape is known.
 */
export function readSmsTemplateDetails(details: Record<string, unknown>): SmsProviderTemplateDetails | null {
  const row = (details?.data as Record<string, unknown>[] | undefined)?.[0];
  if (!row || typeof row !== 'object') return null;

  const text = (value: unknown) => (typeof value === 'string' && value.trim() ? value : undefined);
  const read: SmsProviderTemplateDetails = {
    templateName: text(row.template_name),
    body: text(row.template_data),
    dltId: text(row.DLT_ID),
    senderId: text(row.sender_id),
    version: text(row.version),
    smsType: text(row.sms_type),
    rejectReason: text(row.reject_reason),
  };

  // Nothing recognisable means this is some other vendor's shape
  return Object.values(read).some(Boolean) ? read : null;
}
