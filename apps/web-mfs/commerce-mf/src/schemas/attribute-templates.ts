import { z, zodCodeField } from '@vritti/quantum-ui/zod';

export const createAttributeTemplateSchema = z.object({
  code: zodCodeField({ max: 50 }),
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  description: z.string().max(500, 'Description cannot exceed 500 characters'),
});

export const attributeTemplateValueSchema = z.object({
  code: zodCodeField({ max: 50 }),
  value: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
});

export const attributeTemplateValuesSchema = z.object({
  values: z.array(attributeTemplateValueSchema).min(1, 'Add at least one value'),
});

export const updateAttributeTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  description: z.string().max(500, 'Description cannot exceed 500 characters'),
});

export type CreateAttributeTemplateFormData = z.infer<typeof createAttributeTemplateSchema>;
export type UpdateAttributeTemplateFormData = z.infer<typeof updateAttributeTemplateSchema>;
export type AttributeTemplateValuesFormData = z.infer<typeof attributeTemplateValuesSchema>;

export type TemplateOwnerScope = 'ORG' | 'LE' | 'SITE';

export interface AttributeTemplateValueData {
  id: string;
  templateId: string;
  code: string;
  value: string;
  sortOrder: number;
}

export interface AttributeTemplateData {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  legalEntityId: string | null;
  siteId: string | null;
  ownerScope: TemplateOwnerScope;
  ownerName: string;
  values: AttributeTemplateValueData[];
  valueCount: number;
  canEdit: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAttributeTemplateData {
  code: string;
  name: string;
  description?: string | null;
}

export interface UpdateAttributeTemplateData {
  name?: string;
  description?: string | null;
}

export interface UpsertAttributeTemplateValuesData {
  templateId: string;
  values: { code: string; value: string }[];
}
