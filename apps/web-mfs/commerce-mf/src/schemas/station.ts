import { z } from 'zod/v4';

export interface Station {
  id: string;
  businessUnitId: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export const createStationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export type CreateStationInput = z.infer<typeof createStationSchema>;

export const updateStationSchema = createStationSchema.partial();

export type UpdateStationInput = z.infer<typeof updateStationSchema>;
