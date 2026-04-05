import { zodResolver } from '@hookform/resolvers/zod';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/api-response';
import type { Resolver } from 'react-hook-form';
import { z } from 'zod';

// Runtime schema — z.coerce.number() accepts the string that TextField's onChange provides
const _categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  parentId: z.string().uuid().optional().nullable(),
  sortOrder: z.coerce.number().int().min(1, 'Sort order must be at least 1'),
  isActive: z.boolean(),
});

// TypeScript form type — sortOrder is number for defaultValues, mutation, and form logic
export type CategoryFormData = {
  name: string;
  parentId?: string | null;
  sortOrder: number;
  isActive: boolean;
};

// Pre-typed resolver — casts once here so no `as any` leaks into components
export const categoryFormResolver = zodResolver(_categorySchema) as unknown as Resolver<CategoryFormData>;

export interface CategoryData {
  id: string;
  businessUnitId: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export type CategoryCreateResponse = CreateResponse<CategoryData>;
export type { SuccessResponse };
