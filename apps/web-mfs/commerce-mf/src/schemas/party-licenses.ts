import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z } from '@vritti/quantum-ui/zod';

const LICENSE_TYPES = ['DRUG', 'EXCISE', 'FSSAI', 'OTHER'] as const;

export type PartyLicenseType = (typeof LICENSE_TYPES)[number];

const licenseTypeSchema = z.enum(LICENSE_TYPES);

export const LICENSE_TYPE_LABELS: Record<PartyLicenseType, string> = {
  DRUG: 'Drug',
  EXCISE: 'Excise',
  FSSAI: 'FSSAI',
  OTHER: 'Other',
};

export const LICENSE_TYPE_OPTIONS = LICENSE_TYPES.map((value) => ({
  value,
  label: LICENSE_TYPE_LABELS[value],
}));

export const partyLicenseSchema = z.object({
  licenseType: licenseTypeSchema,
  licenseNumber: z.string().min(1, 'License number is required').max(100),
  region: z.string().max(100).optional(),
  validTo: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type PartyLicenseFormData = z.infer<typeof partyLicenseSchema>;

export interface PartyLicensePayload {
  licenseType: PartyLicenseType;
  licenseNumber: string;
  region?: string | null;
  validTo?: string | null;
  notes?: string | null;
  isActive?: boolean;
}

export interface PartyLicenseRow {
  id: string;
  partyId: string;
  licenseType: PartyLicenseType;
  licenseNumber: string;
  region: string | null;
  validTo: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
}

export type PartyLicensesTableResponse = TableResponse<PartyLicenseRow>;
