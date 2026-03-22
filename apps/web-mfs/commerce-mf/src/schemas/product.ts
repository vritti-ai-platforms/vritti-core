import { z } from 'zod/v4';

export interface Product {
  id: string;
  businessUnitId: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  image: string | null;
  price: string;
  stationId: string | null;
  sku: string | null;
  unit: string | null;
  isAvailable: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.coerce.number().min(0, 'Price must be positive'),
  categoryId: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  stationId: z.string().optional(),
  sku: z.string().optional(),
  unit: z.string().optional(),
  isAvailable: z.boolean().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial();

export type UpdateProductInput = z.infer<typeof updateProductSchema>;
