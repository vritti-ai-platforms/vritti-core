import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z } from '@vritti/quantum-ui/zod';

// The commerce `tax_registration_type` enum — every registration form offers exactly these
export const REGISTRATION_TYPES = ['GSTIN', 'VAT', 'TIN', 'PAN', 'OTHER'] as const;
export type RegistrationType = (typeof REGISTRATION_TYPES)[number];

export const REGISTRATION_TYPE_LABELS: Record<RegistrationType, string> = {
  GSTIN: 'GSTIN',
  VAT: 'VAT',
  TIN: 'TIN',
  PAN: 'PAN',
  OTHER: 'Other',
};

export const REGISTRATION_TYPE_OPTIONS = REGISTRATION_TYPES.map((value) => ({
  value,
  label: REGISTRATION_TYPE_LABELS[value],
}));

export interface TaxRegistrationData {
  id: string;
  legalEntityId: string;
  jurisdictionId: string;
  jurisdictionName: string | null;
  jurisdictionCode: string | null;
  registrationNumber: string;
  registrationType: RegistrationType;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TaxRegistrationsTableResponse = TableResponse<TaxRegistrationData>;

export const createTaxRegistrationSchema = z.object({
  jurisdictionId: z.uuid('Select where the entity is registered'),
  registrationNumber: z
    .string()
    .min(1, 'Registration number is required')
    .max(50, 'Registration number cannot exceed 50 characters'),
  registrationType: z.enum(REGISTRATION_TYPES),
  isPrimary: z.boolean(),
});

export const updateTaxRegistrationSchema = createTaxRegistrationSchema.extend({
  isActive: z.boolean(),
});

export type CreateTaxRegistrationFormData = z.infer<typeof createTaxRegistrationSchema>;
export type UpdateTaxRegistrationFormData = z.infer<typeof updateTaxRegistrationSchema>;

export type CreateTaxRegistrationData = CreateTaxRegistrationFormData;
export type UpdateTaxRegistrationData = Partial<UpdateTaxRegistrationFormData>;
