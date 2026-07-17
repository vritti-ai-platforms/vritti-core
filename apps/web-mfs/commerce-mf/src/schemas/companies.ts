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

export const createCompanySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be at most 255 characters'),
  legalName: z.string().max(255).optional(),
  email: z.string().email('Enter a valid email').max(255).optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  website: z.string().max(255).optional(),
  jurisdictionId: z.uuid('Select a valid jurisdiction').optional(),
  isActive: z.boolean(),
});

export const updateCompanySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).optional(),
  legalName: z.string().max(255).nullable().optional(),
  email: z.string().email('Enter a valid email').max(255).optional().or(z.literal('')),
  phone: z.string().max(20).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  website: z.string().max(255).nullable().optional(),
  jurisdictionId: z.uuid('Select a valid jurisdiction').nullable().optional(),
  isActive: z.boolean().optional(),
});

export const addCompanyPersonSchema = z.object({
  personId: z.uuid('Person is required'),
  jobTitle: z.string().max(100).optional(),
  secondaryPhone: z.string().max(20).optional(),
  secondaryEmail: z.string().email('Enter a valid email').max(255).optional().or(z.literal('')),
  isPrimary: z.boolean().optional(),
});

export const companyRegistrationSchema = z.object({
  jurisdictionId: z.uuid('Jurisdiction is required'),
  registrationNumber: z.string().min(1, 'Registration number is required').max(100),
  registrationType: registrationTypeSchema,
  isPrimary: z.boolean().optional(),
});

export type CreateCompanyFormData = z.infer<typeof createCompanySchema>;
export type UpdateCompanyFormData = z.infer<typeof updateCompanySchema>;
export type AddCompanyPersonFormData = z.infer<typeof addCompanyPersonSchema>;

export interface AddCompanyPersonPayload {
  childPartyId: string;
  jobTitle?: string;
  secondaryPhone?: string;
  secondaryEmail?: string;
  isPrimary?: boolean;
}
export type CompanyRegistrationFormData = z.infer<typeof companyRegistrationSchema>;

export interface CompanyData {
  id: string;
  name: string;
  displayName: string;
  legalName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  jurisdictionId: string | null;
  jurisdictionName: string | null;
  countryCode: string | null;
  isActive: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyPersonRow {
  id: string;
  childPartyId: string;
  childName: string | null;
  jobTitle: string | null;
  secondaryPhone: string | null;
  secondaryEmail: string | null;
  isPrimary: boolean;
}

export interface CompanyTaxRegistrationRow {
  id: string;
  jurisdictionId: string;
  jurisdictionName: string | null;
  registrationNumber: string;
  registrationType: RegistrationType;
  isPrimary: boolean;
}

export type CompaniesTableResponse = TableResponse<CompanyData>;
export type CompanyPeopleTableResponse = TableResponse<CompanyPersonRow>;
export type CompanyRegistrationsTableResponse = TableResponse<CompanyTaxRegistrationRow>;
