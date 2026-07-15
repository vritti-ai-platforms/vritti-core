import { z, zodCodeField, zodResolver } from '@vritti/quantum-ui/zod';
import type { Resolver } from 'react-hook-form';

export interface UomDimensionCountData {
  count: number;
}

export interface UomDimensionData {
  id: string;
  code: string;
  name: string;
  description: string | null;
  canEdit?: boolean;
  canDelete?: boolean;
  createdAt: string;
  updatedAt: string;
}

const _createUomDimensionSchema = z.object({
  code: zodCodeField({ max: 50 }),
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
});

const _updateUomDimensionSchema = _createUomDimensionSchema.partial();

export const createUomDimensionSchema = _createUomDimensionSchema;
export const updateUomDimensionSchema = _updateUomDimensionSchema;

export type CreateUomDimensionData = z.infer<typeof _createUomDimensionSchema>;
export type UpdateUomDimensionData = z.infer<typeof _updateUomDimensionSchema>;
export type CreateUomDimensionFormData = CreateUomDimensionData;
export type UpdateUomDimensionFormData = UpdateUomDimensionData;

export const createUomDimensionResolver = zodResolver(
  _createUomDimensionSchema,
) as unknown as Resolver<CreateUomDimensionFormData>;

export const updateUomDimensionResolver = zodResolver(
  _updateUomDimensionSchema,
) as unknown as Resolver<UpdateUomDimensionFormData>;
