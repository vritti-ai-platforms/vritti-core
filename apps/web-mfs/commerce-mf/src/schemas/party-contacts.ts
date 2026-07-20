import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z } from '@vritti/quantum-ui/zod';

const CONTACT_PURPOSES = ['ORDER', 'ACCOUNTS', 'ESCALATION'] as const;

export type ContactPurpose = (typeof CONTACT_PURPOSES)[number];

const contactPurposeSchema = z.enum(CONTACT_PURPOSES);

export const CONTACT_PURPOSE_LABELS: Record<ContactPurpose, string> = {
  ORDER: 'Order',
  ACCOUNTS: 'Accounts',
  ESCALATION: 'Escalation',
};

export const CONTACT_PURPOSE_OPTIONS = CONTACT_PURPOSES.map((value) => ({
  value,
  label: CONTACT_PURPOSE_LABELS[value],
}));

export const partyContactSchema = z.object({
  purpose: contactPurposeSchema,
  label: z.string().max(100).optional(),
  name: z.string().max(255).optional(),
  email: z.string().email('Enter a valid email').max(255).optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  isPrimary: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export type PartyContactFormData = z.infer<typeof partyContactSchema>;

export interface PartyContactPayload {
  purpose: ContactPurpose;
  label?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  isPrimary?: boolean;
  isActive?: boolean;
}

export interface PartyContactUpdatePayload {
  label?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  isPrimary?: boolean;
  isActive?: boolean;
}

export interface PartyContactRow {
  id: string;
  partyId: string;
  purpose: ContactPurpose;
  label: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
}

export type PartyContactsTableResponse = TableResponse<PartyContactRow>;
