import { z, zodCodeField } from '@vritti/quantum-ui/zod';

export const createDimensionTemplateSchema = z.object({
  code: zodCodeField({ max: 50 }),
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  description: z.string().max(500, 'Description cannot exceed 500 characters'),
});

export const dimensionTemplateValueSchema = z.object({
  code: zodCodeField({ max: 50 }),
  value: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
});

export const dimensionTemplateValuesSchema = z.object({
  values: z.array(dimensionTemplateValueSchema).min(1, 'Add at least one value'),
});

export const updateDimensionTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  description: z.string().max(500, 'Description cannot exceed 500 characters'),
});

export type CreateDimensionTemplateFormData = z.infer<typeof createDimensionTemplateSchema>;
export type UpdateDimensionTemplateFormData = z.infer<typeof updateDimensionTemplateSchema>;
export type DimensionTemplateValuesFormData = z.infer<typeof dimensionTemplateValuesSchema>;

export type TemplateOwnerScope = 'ORG' | 'LE' | 'SITE';

export interface DimensionTemplateValueData {
  id: string;
  templateId: string;
  code: string;
  value: string;
  sortOrder: number;
}

export interface DimensionTemplateData {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  legalEntityId: string | null;
  siteId: string | null;
  ownerScope: TemplateOwnerScope;
  values: DimensionTemplateValueData[];
  valueCount: number;
  canEdit: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDimensionTemplateData {
  code: string;
  name: string;
  description?: string | null;
}

export interface UpdateDimensionTemplateData {
  name?: string;
  description?: string | null;
}

export interface UpsertDimensionTemplateValuesData {
  templateId: string;
  values: { code: string; value: string }[];
}
