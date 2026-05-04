import { zodResolver } from '@hookform/resolvers/zod';
import type { CreateResponse, TableResponse } from '@vritti/quantum-ui/api-response';
import type { Resolver } from 'react-hook-form';
import { z } from 'zod';

// Unified UOM form schema — supports both base and derived units
const _uomFormSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(50),
    symbol: z.string().min(1, 'Symbol is required').max(10),
    kind: z.enum(['base', 'derived']),
    baseUnitId: z.string().optional(),
    conversionFactor: z.coerce.number().positive('Must be greater than 0').optional(),
  })
  .superRefine((data, ctx) => {
    if (data.kind === 'derived') {
      if (!data.baseUnitId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['baseUnitId'],
          message: 'Base unit is required for derived units',
        });
      }
      if (!data.conversionFactor || data.conversionFactor <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['conversionFactor'],
          message: 'Conversion factor is required for derived units',
        });
      }
    }
  });

export type UomFormData = {
  name: string;
  symbol: string;
  kind: 'base' | 'derived';
  baseUnitId?: string;
  conversionFactor?: number;
};

export const uomFormResolver = zodResolver(_uomFormSchema) as unknown as Resolver<UomFormData>;

export type CreateUomResponse = CreateResponse<UomData>;
export type UomTableResponse = TableResponse<UomData>;

export interface CreateUomData {
  name: string;
  symbol: string;
  dimensionId: string;
  baseUnitId?: string | null;
  conversionFactor?: number;
}

export interface UpdateUomData {
  name?: string;
  symbol?: string;
  conversionFactor?: number;
}

export interface UomData {
  id: string;
  name: string;
  symbol: string;
  dimensionId: string;
  baseUnitId: string | null;
  conversionFactor: number;
  canEdit: boolean;
  canDelete: boolean;
  createdAt: string;
}
