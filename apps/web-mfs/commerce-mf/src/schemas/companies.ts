import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z } from '@vritti/quantum-ui/zod';
import {
  type PartyFunctionAssignment,
  type PartyFunctionOption,
  type PartyFunctionResponse,
  partyFunctionAssignmentSchema,
} from './party-functions';
import {
  type PartyRegistrationFormData,
  type PartyRegistrationsTableResponse,
  type PartyTaxRegistrationRow,
  partyRegistrationSchema,
} from './party-registrations';

export { REGISTRATION_TYPE_LABELS, REGISTRATION_TYPE_OPTIONS, type RegistrationType } from './party-registrations';

const CONTACT_FUNCTIONS = ['ORDER', 'ACCOUNTS', 'LOGISTICS', 'ESCALATION'] as const;

export type ContactFunction = (typeof CONTACT_FUNCTIONS)[number];

export const CONTACT_FUNCTION_LABELS: Record<ContactFunction, string> = {
  ORDER: 'Order',
  ACCOUNTS: 'Accounts',
  LOGISTICS: 'Logistics',
  ESCALATION: 'Escalation',
};

export const CONTACT_FUNCTION_OPTIONS: PartyFunctionOption[] = CONTACT_FUNCTIONS.map((value) => ({
  value,
  label: CONTACT_FUNCTION_LABELS[value],
}));

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
  functions: z.array(partyFunctionAssignmentSchema),
});

export const updateCompanyPersonSchema = z.object({
  jobTitle: z.string().max(100).optional(),
  functions: z.array(partyFunctionAssignmentSchema),
});

export const companyRegistrationSchema = partyRegistrationSchema;

export type CreateCompanyFormData = z.infer<typeof createCompanySchema>;
export type UpdateCompanyFormData = z.infer<typeof updateCompanySchema>;
export type AddCompanyPersonFormData = z.infer<typeof addCompanyPersonSchema>;
export type UpdateCompanyPersonFormData = z.infer<typeof updateCompanyPersonSchema>;

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
  jobTitle?: string | null;
  functions?: PartyFunctionAssignment[];
}

export interface UpdateCompanyPersonPayload {
  jobTitle?: string | null;
  functions?: PartyFunctionAssignment[];
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
  childEmail: string | null;
  childPhone: string | null;
  jobTitle: string | null;
  functions: PartyFunctionResponse[];
}

export type CompanyTaxRegistrationRow = PartyTaxRegistrationRow;

export type CompaniesTableResponse = TableResponse<CompanyData>;
export type CompanyPeopleTableResponse = TableResponse<CompanyPersonRow>;
export type CompanyRegistrationsTableResponse = PartyRegistrationsTableResponse;
