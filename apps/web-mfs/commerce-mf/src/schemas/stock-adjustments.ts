import type { TableResponse } from '@vritti/quantum-ui/api-response';
import { z } from 'zod';
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
  EXPIRED: { label: 'Expired', variant: 'secondary' },
  CORRECTION: { label: 'Correction', variant: 'outline' },
};

export const StockAdjustmentStatusValues = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
} as const;
export type StockAdjustmentStatus = (typeof StockAdjustmentStatusValues)[keyof typeof StockAdjustmentStatusValues];

export const stockAdjustmentStatusConfig: Record<StockAdjustmentStatus, { label: string; variant: 'outline' | 'default' }> = {
  DRAFT: { label: 'Draft', variant: 'outline' },
  PUBLISHED: { label: 'Published', variant: 'default' },
};

export { InventoryTrackingValues, type InventoryTracking } from './inventory-items';

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
  createdById: string;

  // Register intent (OPENING_STOCK)
  stockAdjustmentLotId: string | null;
  locationId: string | null;
  locationName: string | null;
  locationPath: string | null;
  // Lot info (denormalized from stock_adjustment_lots — for display)
  lotNumber: string | null;
  manufacturingDate: string | null;
  expiryDate: string | null;

  // Change intent (deduct/CORRECTION)
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
  conversionFactor: number;

  quantity: number;
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
  createdById: string;
  createdByFullName?: string; // populated on detail endpoint only
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
  quantity?: number;
  lineItemsCount?: number;
  isBalanced: boolean;
  children?: StockAdjustmentTreeNode[];
}

export type StockAdjustmentsTableResponse = TableResponse<StockAdjustmentData>;
export type StockAdjustmentLinesTableResponse = TableResponse<StockAdjustmentLineData>;
export type StockAdjustmentLineItemsTableResponse = TableResponse<StockAdjustmentLineItemData>;

// Form schemas

export const createStockAdjustmentSchema = z.object({
  inventoryItemId: z.string().min(1, 'Inventory item is required'),
  type: z.enum(['OPENING_STOCK', 'WASTE', 'DAMAGE', 'THEFT', 'EXPIRED', 'CORRECTION'], {
    message: 'Adjustment type is required',
  }),
  reason: z.string().min(1, 'Reason is required'),
});
export type CreateStockAdjustmentFormData = z.infer<typeof createStockAdjustmentSchema>;

export const addStockAdjustmentLotSchema = z
  .object({
    lotNumber: z.string().min(1, 'Lot number is required').max(100),
    manufacturingDate: z.string().optional(),
    expiryDate: z.string().min(1, 'Expiry date is required'),
  })
  .refine(
    (data) => !data.manufacturingDate || new Date(data.expiryDate) > new Date(data.manufacturingDate),
    { message: 'Expiry date must be after manufacturing date', path: ['expiryDate'] },
  );
export type AddStockAdjustmentLotFormData = z.infer<typeof addStockAdjustmentLotSchema>;

// OPENING_STOCK lines (register intent)
export const addOpeningStockLineSchema = z.object({
  stockAdjustmentLotId: z.string().optional(), // null for tracking='quantity'
  locationId: z.string().min(1, 'Location is required'),
  uomId: z.string().min(1, 'UOM is required'),
  quantity: z.string().min(1, 'Quantity is required'),
});
export type AddOpeningStockLineFormData = z.infer<typeof addOpeningStockLineSchema>;

// Deduct/CORRECTION lines (change intent)
export const addChangeLineSchema = z.object({
  quantId: z.string().min(1, 'Quant is required'),
  uomId: z.string().min(1, 'UOM is required'),
  quantity: z.string().min(1, 'Quantity is required'),
});
export type AddChangeLineFormData = z.infer<typeof addChangeLineSchema>;

export const addStockAdjustmentLineItemSchema = z.object({
  serialNumber: z.string().min(1, 'Serial number is required').max(100),
});
export type AddStockAdjustmentLineItemFormData = z.infer<typeof addStockAdjustmentLineItemSchema>;
