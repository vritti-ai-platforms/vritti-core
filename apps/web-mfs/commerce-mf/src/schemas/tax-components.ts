import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z, zodCodeField } from '@vritti/quantum-ui/zod';

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
  code: zodCodeField({ max: 50 }),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be at most 255 characters'),
  authorityLevel: z.enum(AUTHORITY_LEVELS),
  isRecoverable: z.boolean(),
  isWithholding: z.boolean(),
  isActive: z.boolean(),
});

export const updateTaxComponentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).optional(),
  authorityLevel: z.enum(AUTHORITY_LEVELS).optional(),
  isRecoverable: z.boolean().optional(),
  isWithholding: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export type CreateTaxComponentFormData = z.infer<typeof createTaxComponentSchema>;
export type UpdateTaxComponentFormData = z.infer<typeof updateTaxComponentSchema>;

export interface TaxComponentData {
  id: string;
  code: string;
  name: string;
  authorityLevel: AuthorityLevel;
  isRecoverable: boolean;
  isWithholding: boolean;
  isActive: boolean;
  isSystem: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TaxComponentsTableResponse = TableResponse<TaxComponentData>;
