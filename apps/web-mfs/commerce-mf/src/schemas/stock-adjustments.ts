import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z, zodCurrencyField, zodNumericField } from '@vritti/quantum-ui/zod';
import type { InventoryTracking } from './inventory-items';

export const StockAdjustmentTypeValues = {
  WASTE: 'WASTE',
  DAMAGE: 'DAMAGE',
  THEFT: 'THEFT',
  EXPIRED: 'EXPIRED',
  CORRECTION: 'CORRECTION',
  OPENING_STOCK: 'OPENING_STOCK',
} as const;
export type StockAdjustmentType = (typeof StockAdjustmentTypeValues)[keyof typeof StockAdjustmentTypeValues];

export const stockAdjustmentTypeConfig: Record<
  StockAdjustmentType,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
  OPENING_STOCK: { label: 'Opening Stock', variant: 'default' },
  WASTE: { label: 'Waste', variant: 'destructive' },
  DAMAGE: { label: 'Damage', variant: 'destructive' },
  THEFT: { label: 'Theft', variant: 'destructive' },
  EXPIRED: { label: 'Expired', variant: 'destructive' },
  CORRECTION: { label: 'Correction', variant: 'outline' },
};

export const StockAdjustmentStatusValues = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
} as const;
export type StockAdjustmentStatus = (typeof StockAdjustmentStatusValues)[keyof typeof StockAdjustmentStatusValues];

export const stockAdjustmentStatusConfig: Record<
  StockAdjustmentStatus,
  { label: string; variant: 'outline' | 'default' }
> = {
  DRAFT: { label: 'Draft', variant: 'outline' },
  PUBLISHED: { label: 'Published', variant: 'default' },
};

export { type InventoryTracking, InventoryTrackingValues } from './inventory-items';

export interface StockAdjustmentLotData {
  id: string;
  stockAdjustmentId: string;
  lotNumber: string;
  manufacturingDate: string | null;
  expiryDate: string | null;
  resolvedLotId: string | null;
  linesCount: number;
  totalQuantity: number;
  createdAt: string;
}

export type StockAdjustmentLotDetailData = StockAdjustmentLotData;

export interface StockAdjustmentLineData {
  id: string;
  stockAdjustmentId: string;

  stockAdjustmentLotId: string | null;
  locationId: string | null;
  locationName: string | null;
  locationPath: string | null;
  lotNumber: string | null;
  manufacturingDate: string | null;
  expiryDate: string | null;

  quantId: string | null;
  quantLotNumber: string | null;
  quantLocationId: string | null;
  quantLocationName: string | null;
  quantLocationPath: string | null;
  quantTotalQuantity: number | null;
  quantReservedQuantity: number | null;
  quantAvailableQuantity: number | null;

  uomId: string;
  uomName: string | null;
  uomSymbol: string | null;

  uomQty: number;
  primaryUomQty: number;
  resolvedQuantId: string | null;
  isBalanced: boolean;
  lineItemsCount: number;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface StockAdjustmentLineItemData {
  id: string;
  stockAdjustmentLineId: string;
  serialNumber: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface StockAdjustmentData {
  id: string;
  code: string;
  inventoryItemId: string;
  inventoryItemName: string;
  inventoryItemUomId: string;
  inventoryItemUomSymbol: string;
  inventoryItemTracking: InventoryTracking;
  type: StockAdjustmentType;
  totalQuantity: number;
  status: StockAdjustmentStatus;
  reason: string | null;
  unitCost: { currency: string; value: string } | null;
  isPublishable: boolean;
  metadata: Record<string, unknown>;
  publishedAt: string | null;
  createdAt: string;
}

export interface StockAdjustmentTreeNode {
  id: string;
  name: string;
  path: string[];
  kind: 'lot' | 'line';
  totalQuantity?: number;
  linesCount?: number;
  uomQty?: number;
  lineItemsCount?: number;
  isBalanced: boolean;
  children?: StockAdjustmentTreeNode[];
}

export type StockAdjustmentsTableResponse = TableResponse<StockAdjustmentData>;
export type StockAdjustmentLinesTableResponse = TableResponse<StockAdjustmentLineData>;
export type StockAdjustmentLineItemsTableResponse = TableResponse<StockAdjustmentLineItemData>;

// Form schemas

export const createStockAdjustmentSchema = z
  .object({
    inventoryItemId: z.string().min(1, 'Inventory item is required'),
    type: z.enum(['OPENING_STOCK', 'WASTE', 'DAMAGE', 'THEFT', 'EXPIRED', 'CORRECTION'], {
      message: 'Adjustment type is required',
    }),
    reason: z.string().min(1, 'Reason is required'),
    // Opening-stock valuation (BU currency, per primary UOM). Required when type is OPENING_STOCK.
    unitCost: zodCurrencyField({ positive: true }).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'OPENING_STOCK' && (!data.unitCost?.value || Number(data.unitCost.value) <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['unitCost'],
        message: 'Unit cost is required for opening stock',
      });
    }
  });
export type CreateStockAdjustmentFormData = z.infer<typeof createStockAdjustmentSchema>;

export const updateStockAdjustmentSchema = z.object({
  reason: z.string().min(1, 'Reason is required'),
  unitCost: zodCurrencyField({ positive: true }).optional(),
});
export type UpdateStockAdjustmentFormData = z.infer<typeof updateStockAdjustmentSchema>;

export const addStockAdjustmentLotSchema = z
  .object({
    lotNumber: z.string().min(1, 'Lot number is required').max(100),
    manufacturingDate: z.string().optional(),
    expiryDate: z.string().min(1, 'Expiry date is required'),
  })
  .refine((data) => !data.manufacturingDate || new Date(data.expiryDate) > new Date(data.manufacturingDate), {
    message: 'Expiry date must be after manufacturing date',
    path: ['expiryDate'],
  });
export type AddStockAdjustmentLotFormData = z.infer<typeof addStockAdjustmentLotSchema>;

export const addOpeningStockLineSchema = z.object({
  stockAdjustmentLotId: z.string().optional(), // null for tracking='quantity'
  locationId: z.string().min(1, 'Location is required'),
  uomId: z.string().min(1, 'UOM is required'),
  uomQty: zodNumericField({ required: 'Quantity is required', positive: true }),
});
export type AddOpeningStockLineFormData = z.infer<typeof addOpeningStockLineSchema>;

// Deduct/CORRECTION lines (change intent). Factory because validation depends on adjustment type (CORRECTION allows negative/zero) and the source quant's available qty (maxQty).
export function buildAddChangeLineSchema(opts: { isCorrection: boolean; maxQty?: number }) {
  return z.object({
    quantId: z.string().min(1, 'Quant is required'),
    uomId: z.string().min(1, 'UOM is required'),
    uomQty: opts.isCorrection
      ? zodNumericField({ required: 'Quantity is required', nonZero: true })
      : zodNumericField({ required: 'Quantity is required', positive: true, max: opts.maxQty }),
  });
}
export type AddChangeLineFormData = z.infer<ReturnType<typeof buildAddChangeLineSchema>>;

export function buildUpdateChangeLineSchema(opts: { isCorrection: boolean }) {
  return z.object({
    uomQty: opts.isCorrection
      ? zodNumericField({ required: 'Quantity is required' })
      : zodNumericField({ required: 'Quantity is required', positive: true }),
    uomId: z.string().min(1, 'UOM is required'),
  });
}
export type UpdateChangeLineFormData = z.infer<ReturnType<typeof buildUpdateChangeLineSchema>>;

export const addStockAdjustmentLineItemSchema = z.object({
  serialNumber: z.string().min(1, 'Serial number is required').max(100),
});
export type AddStockAdjustmentLineItemFormData = z.infer<typeof addStockAdjustmentLineItemSchema>;
