import type { CreateResponse, TableResponse } from '@vritti/quantum-ui/api-response';
import { z, zodNumericField, zodResolver } from '@vritti/quantum-ui/zod';
import type { Resolver } from 'react-hook-form';

// Unified UOM form schema — supports both base and derived units
const _uomFormSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(50),
    symbol: z.string().min(1, 'Symbol is required').max(10),
    kind: z.enum(['base', 'derived']),
    baseUnitId: z.string().optional(),
    conversionFactor: zodNumericField({ required: 'Conversion factor is required', positive: true })
      .optional()
      .catch(undefined),
    allowDecimal: z.boolean().default(false),
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
  allowDecimal: boolean;
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
  allowDecimal: boolean;
}

export interface UpdateUomData {
  name?: string;
  symbol?: string;
  conversionFactor?: number;
  allowDecimal?: boolean;
}

export interface UomData {
  id: string;
  name: string;
  symbol: string;
  dimensionId: string;
  baseUnitId: string | null;
  baseUnitSymbol: string | null;
  conversionFactor: number;
  allowDecimal: boolean;
  canEdit: boolean;
  canDelete: boolean;
  createdAt: string;
}
