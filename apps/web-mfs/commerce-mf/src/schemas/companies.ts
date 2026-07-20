import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z } from '@vritti/quantum-ui/zod';
import {
  type PartyRegistrationFormData,
  type PartyRegistrationsTableResponse,
  type PartyTaxRegistrationRow,
  partyRegistrationSchema,
} from './party-registrations';

export { REGISTRATION_TYPE_LABELS, REGISTRATION_TYPE_OPTIONS, type RegistrationType } from './party-registrations';

export const createCompanySchema = z
  .object({
    displayName: z.string().min(1, 'Name is required').max(255, 'Name must be at most 255 characters'),
    legalName: z.string().max(255).optional(),
    email: z.string().email('Enter a valid email').max(255).optional().or(z.literal('')),
    phone: z.string().max(20).optional(),
    website: z.string().max(255).optional(),
    jurisdictionId: z.uuid('Select a valid jurisdiction').nullable().optional(),
    isActive: z.boolean(),
    line1: z.string().max(255).optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    region: z.string().optional(),
    postalCode: z.string().max(20).optional(),
    countryCode: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.line1 && !data.countryCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['countryCode'],
        message: 'Country is required when an address is entered',
      });
    }
  });

export const updateCompanySchema = z
  .object({
    displayName: z.string().min(1, 'Name is required').max(255).optional(),
    legalName: z.string().max(255).nullable().optional(),
    email: z.string().email('Enter a valid email').max(255).optional().or(z.literal('')),
    phone: z.string().max(20).nullable().optional(),
    website: z.string().max(255).nullable().optional(),
    jurisdictionId: z.uuid('Select a valid jurisdiction').nullable().optional(),
    isActive: z.boolean().optional(),
    line1: z.string().max(255).optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    region: z.string().optional(),
    postalCode: z.string().max(20).optional(),
    countryCode: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.line1 && !data.countryCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['countryCode'],
        message: 'Country is required when an address is entered',
      });
    }
  });

export const addCompanyPersonSchema = z.object({
  personId: z.uuid('Person is required'),
  jobTitle: z.string().max(100).optional(),
  secondaryPhone: z.string().max(20).optional(),
  secondaryEmail: z.string().email('Enter a valid email').max(255).optional().or(z.literal('')),
  isPrimary: z.boolean().optional(),
});

export const companyRegistrationSchema = partyRegistrationSchema;

export type CreateCompanyFormData = z.infer<typeof createCompanySchema>;
export type UpdateCompanyFormData = z.infer<typeof updateCompanySchema>;
export type AddCompanyPersonFormData = z.infer<typeof addCompanyPersonSchema>;

export interface CompanyAddressInput {
  line1: string;
  line2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  countryCode: string;
}

export interface CreateCompanyPayload {
  displayName: string;
  legalName?: string;
  email?: string;
  phone?: string;
  website?: string;
  jurisdictionId?: string | null;
  isActive: boolean;
  address?: CompanyAddressInput;
}

export interface UpdateCompanyPayload {
  displayName?: string;
  legalName?: string | null;
  email?: string;
  phone?: string | null;
  website?: string | null;
  jurisdictionId?: string | null;
  isActive?: boolean;
  address?: CompanyAddressInput;
}

export interface AddCompanyPersonPayload {
  childPartyId: string;
  jobTitle?: string;
  secondaryPhone?: string;
  secondaryEmail?: string;
  isPrimary?: boolean;
}
export type CompanyRegistrationFormData = PartyRegistrationFormData;

export interface CompanyData {
  id: string;
  displayName: string;
  legalName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  jurisdictionId: string | null;
  jurisdictionName: string | null;
  isActive: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
  primaryAddress: {
    id: string;
    type: string;
    line1: string;
    line2: string | null;
    city: string | null;
    region: string | null;
    postalCode: string | null;
    countryCode: string;
  } | null;
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

export type CompanyTaxRegistrationRow = PartyTaxRegistrationRow;

export type CompaniesTableResponse = TableResponse<CompanyData>;
export type CompanyPeopleTableResponse = TableResponse<CompanyPersonRow>;
export type CompanyRegistrationsTableResponse = PartyRegistrationsTableResponse;
