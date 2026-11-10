import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z, zodCodeField } from '@vritti/quantum-ui/zod';
import { countryCodeField } from './tax-jurisdictions';

export const AUTHORITY_LEVELS = ['FEDERAL', 'STATE', 'COUNTY', 'CITY', 'SPECIAL'] as const;

export type AuthorityLevel = (typeof AUTHORITY_LEVELS)[number];

export const AUTHORITY_LEVEL_LABELS: Record<AuthorityLevel, string> = {
  FEDERAL: 'Federal',
  STATE: 'State',
  COUNTY: 'County',
  CITY: 'City',
  SPECIAL: 'Special',
};

export const authorityLevelOptions: { value: AuthorityLevel; label: string }[] = AUTHORITY_LEVELS.map((value) => ({
  value,
  label: AUTHORITY_LEVEL_LABELS[value],
}));

export const createTaxComponentSchema = z.object({
  countryCode: countryCodeField,
  code: zodCodeField({ max: 50 }),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be at most 255 characters'),
  authorityLevel: z.enum(AUTHORITY_LEVELS),
  standsInForId: z.uuid().nullish(),
  isRecoverable: z.boolean(),
  isWithholding: z.boolean(),
  isActive: z.boolean(),
});

export const updateTaxComponentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).optional(),
  authorityLevel: z.enum(AUTHORITY_LEVELS).optional(),
  standsInForId: z.uuid().nullish(),
  isRecoverable: z.boolean().optional(),
  isWithholding: z.boolean().optional(),
});

export type CreateTaxComponentFormData = z.infer<typeof createTaxComponentSchema>;
export type UpdateTaxComponentFormData = z.infer<typeof updateTaxComponentSchema>;

// `countryCode` and `code` are immutable but shown disabled in the edit form, so they belong to the form type only
export const editTaxComponentFormSchema = updateTaxComponentSchema.extend({
  countryCode: z.string(),
  code: z.string(),
});
export type EditTaxComponentFormData = z.infer<typeof editTaxComponentFormSchema>;

export interface TaxComponentData {
  id: string;
  countryCode: string;
  code: string;
  name: string;
  authorityLevel: AuthorityLevel;
  standsInForId: string | null;
  standsInForName: string | null;
  isRecoverable: boolean;
  isWithholding: boolean;
  isActive: boolean;
  isSystem: boolean;
  canDelete: boolean;
  canDeactivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TaxComponentsTableResponse = TableResponse<TaxComponentData>;

export interface CreateTaxComponentPayload {
  countryCode: string;
  code: string;
  name: string;
  authorityLevel: AuthorityLevel;
  standsInForId: string | null;
  isRecoverable: boolean;
  isWithholding: boolean;
  isActive: boolean;
}

export type UpdateTaxComponentPayload = Partial<Omit<CreateTaxComponentPayload, 'countryCode' | 'code' | 'isActive'>>;
