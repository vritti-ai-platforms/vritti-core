import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';
import { z } from 'zod';

export interface UomDimensionData {
  id: string;
  code: string;
  name: string;
  description: string | null;
  canDelete?: boolean;
  createdAt: string;
  updatedAt: string;
}

const _createUomDimensionSchema = z.object({
  code: z
    .string()
    .min(1, 'Code is required')
    .max(50)
    .regex(/^[A-Z][A-Z0-9_]*$/, 'Use uppercase letters, digits, underscores'),
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
