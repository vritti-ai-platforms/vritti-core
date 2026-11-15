import type { CurrencyValue } from '@vritti/quantum-ui/currency';
import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z, zodCodeField } from '@vritti/quantum-ui/zod';
import type { MeasureFigures } from './measures';

const INVENTORY_ITEM_TYPES = ['RAW_MATERIAL', 'SEMI_FINISHED', 'FINISHED_GOOD', 'PACKAGING', 'CONSUMABLE'] as const;

export const createOrgInventoryItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  sku: zodCodeField({ max: 100 }),
  type: z.enum(INVENTORY_ITEM_TYPES),
  tracking: z.enum(['QUANTITY', 'LOT', 'LOT_SERIAL', 'SERIAL']),
  categoryId: z.uuid('Category is required'),
  description: z.string().optional(),
  uomId: z.uuid('Unit of measure is required'),
  pickStrategy: z.enum(['NONE', 'FIFO', 'FEFO']).optional(),
  hsnCode: z.string().max(20).optional(),
  taxClassId: z.uuid('Tax class is required'),
  createOffering: z.boolean(),
});

export const updateOrgInventoryItemSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  sku: zodCodeField({ max: 100 }).optional(),
  type: z.enum(INVENTORY_ITEM_TYPES).optional(),
  description: z.string().nullable().optional(),
  categoryId: z.uuid('Category is required').optional(),
  uomId: z.uuid('Unit of measure is required').optional(),
  pickStrategy: z.enum(['NONE', 'FIFO', 'FEFO']).optional(),
  hsnCode: z.string().max(20).nullable().optional(),
  taxClassId: z.uuid('Tax class is required').optional(),
});

export type CreateOrgInventoryItemFormData = z.infer<typeof createOrgInventoryItemSchema>;
export type UpdateOrgInventoryItemFormData = z.infer<typeof updateOrgInventoryItemSchema>;
export type UpdateOrgInventoryItemPayload = UpdateOrgInventoryItemFormData & Partial<MeasureFigures>;
export type SiteStockTableResponse = TableResponse<SiteStockTableItemData>;
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
  QUANTITY: 'QUANTITY',
  LOT: 'LOT',
  SERIAL: 'SERIAL',
  LOT_SERIAL: 'LOT_SERIAL',
} as const;

export type InventoryTracking = (typeof InventoryTrackingValues)[keyof typeof InventoryTrackingValues];

export const inventoryTrackingConfig: Record<
  InventoryTracking,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' }
> = {
  QUANTITY: { label: 'Quantity', variant: 'outline' },
  LOT: { label: 'Lot', variant: 'secondary' },
  SERIAL: { label: 'Serial', variant: 'default' },
  LOT_SERIAL: { label: 'Lot + Serial', variant: 'default' },
};

export const InventoryPickStrategyValues = {
  NONE: 'NONE',
  FIFO: 'FIFO',
  FEFO: 'FEFO',
} as const;

export type InventoryPickStrategy = (typeof InventoryPickStrategyValues)[keyof typeof InventoryPickStrategyValues];

export interface InventoryItemData extends MeasureFigures {
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
  taxClassId: string;
  taxClassName: string | null;
  hsnCode: string | null;
  defaultMrp: CurrencyValue | null;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
}

// Where a site's on-hand quantity of an item sits against its stock levels
export const StockStatusValues = {
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  BELOW_SAFETY_STOCK: 'BELOW_SAFETY_STOCK',
  REORDER: 'REORDER',
  HEALTHY: 'HEALTHY',
  OVER_MAX: 'OVER_MAX',
} as const;
export type StockStatus = (typeof StockStatusValues)[keyof typeof StockStatusValues];

// The site stock table's status filter options: whether an item has stock levels set at all, each stock status, and
// the band between the safety stock and the reorder point on its own
export const StockStatusFilterValues = {
  HAS_STOCK_LEVELS: 'HAS_STOCK_LEVELS',
  NO_STOCK_LEVELS: 'NO_STOCK_LEVELS',
  BETWEEN_SAFETY_STOCK_AND_REORDER: 'BETWEEN_SAFETY_STOCK_AND_REORDER',
  ...StockStatusValues,
} as const;

export const stockStatusConfig: Record<
  StockStatus,
  { label: string; tip: string; variant: 'destructive' | 'warning' | 'success' | 'excess'; fill: string }
> = {
  [StockStatusValues.OUT_OF_STOCK]: {
    label: 'Out of Stock',
    tip: 'None on hand',
    variant: 'destructive',
    fill: 'bg-destructive',
  },
  [StockStatusValues.BELOW_SAFETY_STOCK]: {
    label: 'Below Safety Stock',
    tip: 'At or below the safety stock',
    variant: 'destructive',
    fill: 'bg-destructive',
  },
  [StockStatusValues.REORDER]: {
    label: 'Below Reorder',
    tip: 'At or below the reorder point',
    variant: 'warning',
    fill: 'bg-warning',
  },
  [StockStatusValues.HEALTHY]: {
    label: 'Healthy',
    tip: 'Above the reorder point and within the max level',
    variant: 'success',
    fill: 'bg-success',
  },
  [StockStatusValues.OVER_MAX]: {
    label: 'Over Max',
    tip: 'Above the max level',
    variant: 'excess',
    fill: 'bg-group-violet',
  },
};

// An item's stock at one site, as the stock level cell draws it
export interface SiteStockData {
  stockStatus: StockStatus | null;
  onHand: number;
  stockValue: CurrencyValue;
  reorderPoint: number | null;
  safetyStock: number | null;
  maxStockLevel: number | null;
  locations: SiteStockLocationData[];
}

// An item's stock at a site and its levels there, as the inventory item picker returns them in each option's additionals
// once it is asked for the items with stock levels at a site
export const siteStockLevelsAdditionalsSchema = z.object({
  onHand: z.number(),
  safetyStock: z.number(),
  reorderPoint: z.number(),
  maxStockLevel: z.number(),
  stockStatus: z.enum(StockStatusValues),
  stockValue: z.object({ currency: z.string(), value: z.string() }),
  locations: z.array(
    z.object({
      locationId: z.string(),
      locationName: z.string(),
      locationPath: z.string(),
      quantity: z.number(),
      lotCount: z.number(),
      earliestExpiry: z.string().nullable(),
    }),
  ),
  uomSymbol: z.string().nullable(),
  // Whether the item's primary unit can be counted in fractions; false without a unit
  allowDecimal: z.boolean().nullable(),
});
export type SiteStockLevelsAdditionals = z.infer<typeof siteStockLevelsAdditionalsSchema>;

// The status context filter both stock tables share: the server widens a shortfall to every worse one, so Below Reorder
// also lists Below Safety Stock and Out of Stock, while Between Safety Stock and Reorder is that band alone
export const stockStatusFilterOptions = [
  { label: 'Has Stock Levels', value: StockStatusFilterValues.HAS_STOCK_LEVELS },
  { label: 'No Stock Levels', value: StockStatusFilterValues.NO_STOCK_LEVELS },
  { label: stockStatusConfig.OUT_OF_STOCK.label, value: StockStatusFilterValues.OUT_OF_STOCK },
  { label: stockStatusConfig.BELOW_SAFETY_STOCK.label, value: StockStatusFilterValues.BELOW_SAFETY_STOCK },
  { label: 'Between Safety Stock and Reorder', value: StockStatusFilterValues.BETWEEN_SAFETY_STOCK_AND_REORDER },
  { label: stockStatusConfig.REORDER.label, value: StockStatusFilterValues.REORDER },
  { label: stockStatusConfig.HEALTHY.label, value: StockStatusFilterValues.HEALTHY },
  { label: stockStatusConfig.OVER_MAX.label, value: StockStatusFilterValues.OVER_MAX },
];

// The status filter for items that all have stock levels set: every option but whether they are set at all
export const stockLevelStatusFilterOptions = stockStatusFilterOptions.filter(
  (option) =>
    option.value !== StockStatusFilterValues.HAS_STOCK_LEVELS &&
    option.value !== StockStatusFilterValues.NO_STOCK_LEVELS,
);

export interface SiteStockLocationData {
  locationId: string;
  locationName: string;
  locationPath: string;
  quantity: number;
  lotCount: number;
  earliestExpiry: string | null;
}

export interface SiteStockTableItemData extends InventoryItemData {
  hasStockLevels: boolean;
  reorderPoint: number | null;
  safetyStock: number | null;
  maxStockLevel: number | null;
  onHand: number;
  stockValue: CurrencyValue;
  stockStatus: StockStatus | null;
  locations: SiteStockLocationData[];
}

export interface InventoryItemStockData {
  locationId: string;
  locationName: string | null;
  locationPath: string | null;
  stockedQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
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
  NONE: { label: 'None', hint: 'free pick' },
  FIFO: { label: 'FIFO', hint: 'oldest received first' },
  FEFO: { label: 'FEFO', hint: 'nearest expiry first' },
};

// Select options carry the hint alongside the label; derived so the two can never disagree
export const pickStrategyOptions = (Object.keys(inventoryPickStrategyConfig) as InventoryPickStrategy[]).map(
  (value) => ({
    value,
    label: `${inventoryPickStrategyConfig[value].label} — ${inventoryPickStrategyConfig[value].hint}`,
  }),
);

export const trackingOptions = [
  { value: InventoryTrackingValues.QUANTITY, label: 'Quantity — bulk fungible (e.g. office supplies)' },
  { value: InventoryTrackingValues.LOT, label: 'Lot — batch identity (mfg/expiry, lot #)' },
  { value: InventoryTrackingValues.SERIAL, label: 'Serial — per unit, no batch (e.g. IT assets, tools)' },
  { value: InventoryTrackingValues.LOT_SERIAL, label: 'Lot + Serial — per unit within batch (e.g. pharma)' },
];

// The inventory counterpart of a variant. No sku field — the server takes it from the variant.
export const createVariantInventoryItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  type: z.enum(INVENTORY_ITEM_TYPES),
  tracking: z.enum(['QUANTITY', 'LOT', 'LOT_SERIAL', 'SERIAL']),
  pickStrategy: z.enum(['NONE', 'FIFO', 'FEFO']),
  categoryId: z.uuid('Category is required'),
  uomId: z.uuid('Unit is required'),
  description: z.string().max(500).optional(),
  hsnCode: z.string().max(20).optional(),
});

export type CreateVariantInventoryItemFormData = z.infer<typeof createVariantInventoryItemSchema>;
