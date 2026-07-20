import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z } from '@vritti/quantum-ui/zod';

const REGISTRATION_TYPES = ['GST', 'VAT', 'EIN', 'TIN', 'PAN', 'SALES_TAX', 'OTHER'] as const;

export type RegistrationType = (typeof REGISTRATION_TYPES)[number];

const registrationTypeSchema = z.enum(REGISTRATION_TYPES);

export const REGISTRATION_TYPE_LABELS: Record<RegistrationType, string> = {
  GST: 'GST',
  VAT: 'VAT',
  EIN: 'EIN',
  TIN: 'TIN',
  PAN: 'PAN',
  SALES_TAX: 'Sales Tax',
  OTHER: 'Other',
};

export const REGISTRATION_TYPE_OPTIONS = REGISTRATION_TYPES.map((value) => ({
  value,
  label: REGISTRATION_TYPE_LABELS[value],
}));

export const partyRegistrationSchema = z.object({
  jurisdictionId: z.uuid('Jurisdiction is required'),
  registrationNumber: z.string().min(1, 'Registration number is required').max(100),
  registrationType: registrationTypeSchema,
  isPrimary: z.boolean().optional(),
});

export type PartyRegistrationFormData = z.infer<typeof partyRegistrationSchema>;

export interface PartyTaxRegistrationRow {
  id: string;
  jurisdictionId: string;
  jurisdictionName: string | null;
  registrationNumber: string;
  registrationType: RegistrationType;
  isPrimary: boolean;
}

export type PartyRegistrationsTableResponse = TableResponse<PartyTaxRegistrationRow>;
