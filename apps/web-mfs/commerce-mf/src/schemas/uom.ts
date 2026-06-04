import type { CreateResponse, TableResponse } from '@vritti/quantum-ui/api-response';
import { z, zodNumericField, zodResolver } from '@vritti/quantum-ui/zod';
import type { Resolver } from 'react-hook-form';

// Unified UOM form schema — supports both base and derived units.
// For derived units, the user enters the integer pair: 1 Box = 12 Each → baseUomQty=12, uomQty=1.
const positiveInt = zodNumericField({ positive: true, integer: true });

const _uomFormSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(50),
    symbol: z.string().min(1, 'Symbol is required').max(10),
    kind: z.enum(['base', 'derived']),
    baseUnitId: z.string().optional(),
    baseUomQty: positiveInt.optional().catch(undefined),
    uomQty: positiveInt.optional().catch(undefined),
    allowDecimal: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.kind === 'derived') {
      if (!data.baseUnitId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['baseUnitId'],
          message: 'Pick a base unit',
        });
      }
      if (!data.baseUomQty || data.baseUomQty <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['baseUomQty'],
          message: 'Count is required',
        });
      }
      if (!data.uomQty || data.uomQty <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['uomQty'],
          message: 'Count is required',
        });
      }
    }
  });

export type UomFormData = {
  name: string;
  symbol: string;
  kind: 'base' | 'derived';
  baseUnitId?: string;
  baseUomQty?: number;
  uomQty?: number;
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
  baseUomQty?: number;
  uomQty?: number;
  allowDecimal: boolean;
}

export interface UpdateUomData {
  name?: string;
  symbol?: string;
  baseUomQty?: number;
  uomQty?: number;
  allowDecimal?: boolean;
}

export interface UomData {
  id: string;
  name: string;
  symbol: string;
  dimensionId: string;
  baseUnitId: string | null;
  baseUnitSymbol: string | null;
  baseUomQty: number;
  uomQty: number;
  allowDecimal: boolean;
  canEdit: boolean;
  canDelete: boolean;
  createdAt: string;
}
