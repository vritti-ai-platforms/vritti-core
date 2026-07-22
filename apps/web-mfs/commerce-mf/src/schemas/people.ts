import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z } from '@vritti/quantum-ui/zod';
import { identifierTypeSchema } from './party-identifiers';

export const createPersonSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required').max(255, 'First name must be at most 255 characters'),
    lastName: z.string().max(255, 'Last name must be at most 255 characters').optional(),
    email: z.string().email('Enter a valid email').max(255).optional().or(z.literal('')),
    phone: z.string().max(20).optional(),
    identifierType: identifierTypeSchema.optional(),
    identifierValue: z.string().max(100).optional(),
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

export const updatePersonSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(255).optional(),
  lastName: z.string().max(255).nullable().optional(),
  email: z.string().email('Enter a valid email').max(255).optional().or(z.literal('')),
  phone: z.string().max(20).nullable().optional(),
  isActive: z.boolean().optional(),
});

export type CreatePersonFormData = z.infer<typeof createPersonSchema>;
export type UpdatePersonFormData = z.infer<typeof updatePersonSchema>;

export interface PersonData {
  id: string;
  firstName: string;
  lastName: string | null;
  displayName: string;
  email: string | null;
  phone: string | null;
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

export type PeopleTableResponse = TableResponse<PersonData>;

export interface PersonCompanyRow {
  id: string;
  companyId: string;
  companyName: string;
  jobTitle: string | null;
  isActive: boolean;
}

export type PersonCompaniesTableResponse = TableResponse<PersonCompanyRow>;
