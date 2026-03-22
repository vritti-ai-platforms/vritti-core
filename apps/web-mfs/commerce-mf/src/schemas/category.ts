import { z } from 'zod/v4';

export interface Category {
  id: string;
  businessUnitId: string;
  name: string;
  image: string | null;
  parentId: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  image: z.string().optional(),
  parentId: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = createCategorySchema.partial();

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
