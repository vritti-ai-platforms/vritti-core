import type { CurrencyValue } from '@vritti/quantum-ui/currency';
import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z, zodCodeField, zodCurrencyField, zodNumericField } from '@vritti/quantum-ui/zod';

const INVENTORY_ITEM_TYPES = ['RAW_MATERIAL', 'SEMI_FINISHED', 'FINISHED_GOOD', 'PACKAGING', 'CONSUMABLE'] as const;

export const createInventoryItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  sku: zodCodeField({ max: 100 }),
  type: z.enum(INVENTORY_ITEM_TYPES),
  tracking: z.enum(['quantity', 'lot', 'lot_serial', 'serial']),
  categoryId: z.uuid('Category is required'),
  description: z.string().optional(),
  uomId: z.string().uuid('Unit of measure is required'),
  pickStrategy: z.enum(['none', 'fifo', 'fefo']).optional(),
  purchaseTaxGroupId: z.uuid('Purchase tax group is required'),
  hsnCode: z.string().max(20).optional(),
  defaultMrp: zodCurrencyField({ positive: true }).optional(),
});

export const updateInventoryItemSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  sku: zodCodeField({ max: 100 }).optional(),
  type: z.enum(INVENTORY_ITEM_TYPES).optional(),
  description: z.string().nullable().optional(),
  categoryId: z.uuid('Category is required').optional(),
  uomId: z.uuid('Unit of measure is required').optional(),
  pickStrategy: z.enum(['none', 'fifo', 'fefo']).optional(),
  purchaseTaxGroupId: z.uuid('Purchase tax group is required'),
  hsnCode: z.string().max(20).nullable().optional(),
  defaultMrp: zodCurrencyField({ positive: true }).optional(),
});

// ORG master item — no purchaseTaxGroupId / defaultMrp (those are site/pricing concerns)
export const createOrgInventoryItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  sku: zodCodeField({ max: 100 }),
  type: z.enum(INVENTORY_ITEM_TYPES),
  tracking: z.enum(['quantity', 'lot', 'lot_serial', 'serial']),
  categoryId: z.uuid('Category is required'),
  description: z.string().optional(),
  uomId: z.string().uuid('Unit of measure is required'),
  pickStrategy: z.enum(['none', 'fifo', 'fefo']).optional(),
  hsnCode: z.string().max(20).optional(),
});

export const updateOrgInventoryItemSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  sku: zodCodeField({ max: 100 }).optional(),
  type: z.enum(INVENTORY_ITEM_TYPES).optional(),
  description: z.string().nullable().optional(),
  categoryId: z.uuid('Category is required').optional(),
  uomId: z.uuid('Unit of measure is required').optional(),
  pickStrategy: z.enum(['none', 'fifo', 'fefo']).optional(),
  hsnCode: z.string().max(20).nullable().optional(),
});

// SITE — enable a master item at the current site with optional stock thresholds
export const enableInventoryItemSchema = z.object({
  inventoryItemId: z.uuid('Inventory item is required'),
  reorderPoint: zodNumericField({ min: 0, nullable: true }).optional(),
  maxStockLevel: zodNumericField({ min: 0, nullable: true }).optional(),
  safetyStock: zodNumericField({ min: 0, nullable: true }).optional(),
});

export const updateReorderSchema = z.object({
  reorderPoint: zodNumericField({ required: 'Reorder point is required', min: 0 }),
});

export type CreateInventoryItemFormData = z.infer<typeof createInventoryItemSchema>;
export type UpdateInventoryItemFormData = z.infer<typeof updateInventoryItemSchema>;
export type CreateOrgInventoryItemFormData = z.infer<typeof createOrgInventoryItemSchema>;
export type UpdateOrgInventoryItemFormData = z.infer<typeof updateOrgInventoryItemSchema>;
export type EnableInventoryItemFormData = z.infer<typeof enableInventoryItemSchema>;
export type UpdateReorderFormData = z.infer<typeof updateReorderSchema>;
export type InventoryItemsTableResponse = TableResponse<InventoryItemData>;
export type InventoryItemTableResponse = TableResponse<InventoryItemData>;

export type InventoryItemType = (typeof INVENTORY_ITEM_TYPES)[number];

export const InventoryItemTypeValues = {
  RAW_MATERIAL: 'RAW_MATERIAL',
  SEMI_FINISHED: 'SEMI_FINISHED',
  FINISHED_GOOD: 'FINISHED_GOOD',
  PACKAGING: 'PACKAGING',
  CONSUMABLE: 'CONSUMABLE',
} as const;

export const inventoryItemTypeConfig: Record<
  InventoryItemType,
  { label: string; variant: 'secondary' | 'outline' | 'default' }
> = {
  RAW_MATERIAL: { label: 'Raw Material', variant: 'secondary' },
  SEMI_FINISHED: { label: 'Semi-Finished', variant: 'outline' },
  FINISHED_GOOD: { label: 'Finished Good', variant: 'default' },
  PACKAGING: { label: 'Packaging', variant: 'outline' },
  CONSUMABLE: { label: 'Consumable', variant: 'secondary' },
};

export const inventoryItemTypeOptions: { value: InventoryItemType; label: string }[] = [
  { value: 'RAW_MATERIAL', label: 'Raw Material' },
  { value: 'SEMI_FINISHED', label: 'Semi-Finished' },
  { value: 'FINISHED_GOOD', label: 'Finished Good' },
  { value: 'PACKAGING', label: 'Packaging' },
  { value: 'CONSUMABLE', label: 'Consumable' },
];

export const InventoryTrackingValues = {
  QUANTITY: 'quantity',
  LOT: 'lot',
  SERIAL: 'serial',
  LOT_SERIAL: 'lot_serial',
} as const;

export type InventoryTracking = (typeof InventoryTrackingValues)[keyof typeof InventoryTrackingValues];

export const inventoryTrackingConfig: Record<
  InventoryTracking,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' }
> = {
  quantity: { label: 'Quantity', variant: 'outline' },
  lot: { label: 'Lot', variant: 'secondary' },
  serial: { label: 'Serial', variant: 'default' },
  lot_serial: { label: 'Lot + Serial', variant: 'default' },
};

export type InventoryPickStrategy = 'none' | 'fifo' | 'fefo';

export const InventoryPickStrategyValues = { NONE: 'none', FIFO: 'fifo', FEFO: 'fefo' } as const;

export interface InventoryItemData {
  id: string;
  name: string;
  sku: string;
  type: InventoryItemType;
  tracking: InventoryTracking;
  pickStrategy: InventoryPickStrategy;
  categoryId: string;
  categoryName: string | null;
  description: string | null;
  uomId: string;
  uomSymbol: string | null;
  purchaseTaxGroupId: string | null;
  purchaseTaxGroupName: string | null;
  hsnCode: string | null;
  defaultMrp: CurrencyValue | null;
  reorderPoint: number | null;
  maxStockLevel: number | null;
  safetyStock: number | null;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItemStockData {
  locationId: string;
  locationName: string | null;
  locationPath: string | null;
  stockedQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderLevel: number | null;
}

export type InventoryItemLedgerType =
  | 'GOODS_RECEIPT'
  | 'OPENING_STOCK'
  | 'ORDER_RESERVE'
  | 'ORDER_DEDUCT'
  | 'ORDER_CANCEL'
  | 'ADJUSTMENT'
  | 'CONVERSION_INPUT'
  | 'CONVERSION_OUTPUT'
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN';

export interface InventoryItemLedgerData {
  id: string;
  type: InventoryItemLedgerType;
  quantity: number;
  balanceAfter: number;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  createdAt: string;
}

export type InventoryItemLedgerTableResponse = TableResponse<InventoryItemLedgerData>;

// Short labels for display, mirroring inventoryItemTypeConfig and inventoryTrackingConfig
export const inventoryPickStrategyConfig: Record<InventoryPickStrategy, { label: string; hint: string }> = {
  none: { label: 'None', hint: 'free pick' },
  fifo: { label: 'FIFO', hint: 'oldest received first' },
  fefo: { label: 'FEFO', hint: 'nearest expiry first' },
};

// Select options carry the hint alongside the label; derived so the two can never disagree
export const pickStrategyOptions = (Object.keys(inventoryPickStrategyConfig) as InventoryPickStrategy[]).map(
  (value) => ({
    value,
    label: `${inventoryPickStrategyConfig[value].label} — ${inventoryPickStrategyConfig[value].hint}`,
  }),
);

export const trackingOptions = [
  { value: 'quantity', label: 'Quantity — bulk fungible (e.g. office supplies)' },
  { value: 'lot', label: 'Lot — batch identity (mfg/expiry, lot #)' },
  { value: 'serial', label: 'Serial — per unit, no batch (e.g. IT assets, tools)' },
  { value: 'lot_serial', label: 'Lot + Serial — per unit within batch (e.g. pharma)' },
];

// The inventory counterpart of a variant. No sku field — the server takes it from the variant.
export const createVariantInventoryItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  type: z.enum(INVENTORY_ITEM_TYPES),
  tracking: z.enum(['quantity', 'lot', 'lot_serial', 'serial']),
  pickStrategy: z.enum(['none', 'fifo', 'fefo']),
  categoryId: z.string().min(1, 'Category is required'),
  uomId: z.string().min(1, 'Unit is required'),
  description: z.string().max(500).optional(),
  hsnCode: z.string().max(20).optional(),
});

export type CreateVariantInventoryItemFormData = z.infer<typeof createVariantInventoryItemSchema>;
