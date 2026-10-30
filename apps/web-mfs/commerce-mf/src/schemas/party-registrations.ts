import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z } from '@vritti/quantum-ui/zod';
import { REGISTRATION_TYPES, type RegistrationType } from './tax-registrations';

export { REGISTRATION_TYPE_LABELS, REGISTRATION_TYPE_OPTIONS, type RegistrationType } from './tax-registrations';

const registrationTypeSchema = z.enum(REGISTRATION_TYPES);

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
  // Inactive registrations stay on record but cannot be picked for a supplier's site enrollment
  isActive: boolean;
}

export type PartyRegistrationsTableResponse = TableResponse<PartyTaxRegistrationRow>;
