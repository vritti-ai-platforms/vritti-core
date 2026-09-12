import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z } from '@vritti/quantum-ui/zod';

export const REGISTRATION_TYPES = ['GSTIN', 'VAT', 'TIN', 'PAN', 'OTHER'] as const;
export type RegistrationType = (typeof REGISTRATION_TYPES)[number];

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
  jurisdictionId: z.string().min(1, 'Select where the entity is registered'),
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
