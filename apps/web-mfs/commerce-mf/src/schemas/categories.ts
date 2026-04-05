import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/api-response';
import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  sortOrder: z.number().int().min(1, 'Sort order must be at least 1'),
  isActive: z.boolean(),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

export interface CategoryData {
  id: string;
  businessUnitId: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export type CategoryCreateResponse = CreateResponse<CategoryData>;
export type { SuccessResponse };
