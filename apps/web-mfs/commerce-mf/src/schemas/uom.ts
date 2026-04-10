import type { TableResponse } from '@vritti/quantum-ui/api-response';
import { z } from 'zod';

export const createUomSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  symbol: z.string().min(1, 'Symbol is required').max(10),
  baseUnitId: z.string().optional(),
  conversionFactor: z.string().optional(),
});

export const updateUomSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50).optional(),
  symbol: z.string().min(1, 'Symbol is required').max(10).optional(),
  baseUnitId: z.string().nullable().optional(),
  conversionFactor: z.string().optional(),
});

export type CreateUomFormData = z.infer<typeof createUomSchema>;
export type UpdateUomFormData = z.infer<typeof updateUomSchema>;

export type UomTableResponse = TableResponse<UomData>;

export interface UomData {
  id: string;
  name: string;
  symbol: string;
  baseUnitId: string | null;
  baseUnitSymbol: string | null;
  conversionFactor: number;
  createdAt: string;
}
