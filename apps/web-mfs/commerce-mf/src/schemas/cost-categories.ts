import type { TableResponse } from '@vritti/quantum-ui/api-response';
import { z } from '@vritti/quantum-ui/zod';

export const COST_CATEGORY_KIND_VALUES = ['ITEM', 'FREIGHT', 'DUTY', 'INSURANCE', 'SERVICE', 'OTHER'] as const;
export type CostCategoryKind = (typeof COST_CATEGORY_KIND_VALUES)[number];

export const COST_CATEGORY_KIND_OPTIONS: { value: CostCategoryKind; label: string; description?: string }[] = [
  { value: 'ITEM', label: 'Item', description: 'Supplier price (exactly one per org)' },
  { value: 'FREIGHT', label: 'Freight', description: 'Inward freight, internal transfers, etc.' },
  { value: 'DUTY', label: 'Duty', description: 'Customs / import duties' },
  { value: 'INSURANCE', label: 'Insurance', description: 'Cargo / transit insurance' },
  { value: 'SERVICE', label: 'Service', description: 'Handling, inspection, certifications' },
  { value: 'OTHER', label: 'Other', description: 'Anything not covered above' },
];

const kindSchema = z.enum(COST_CATEGORY_KIND_VALUES);

export const createCostCategorySchema = z.object({
  code: z
    .string()
    .min(1, 'Code is required')
    .max(50, 'Code must be at most 50 characters')
    .regex(/^[A-Z0-9_]+$/, 'Use uppercase letters, digits, and underscores only'),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be at most 255 characters'),
  kind: kindSchema,
});

export const updateCostCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).optional(),
  isActive: z.boolean().optional(),
});

export type CreateCostCategoryFormData = z.infer<typeof createCostCategorySchema>;
export type UpdateCostCategoryFormData = z.infer<typeof updateCostCategorySchema>;

export interface CostCategoryData {
  id: string;
  code: string;
  name: string;
  kind: CostCategoryKind;
  isActive: boolean;
  isSystem: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CostCategoriesTableResponse = TableResponse<CostCategoryData>;
