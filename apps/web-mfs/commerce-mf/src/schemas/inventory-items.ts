import type { TableResponse } from '@vritti/quantum-ui/api-response';
import { z } from 'zod';

const INVENTORY_ITEM_TYPES = ['RAW_MATERIAL', 'SEMI_FINISHED', 'FINISHED_GOOD', 'PACKAGING', 'CONSUMABLE'] as const;

export const createInventoryItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  code: z.string().min(1, 'Code is required').max(100),
  type: z.enum(INVENTORY_ITEM_TYPES),
  tracking: z.enum(['quantity', 'lot', 'lot_serial', 'serial']),
  categoryId: z.string().uuid('Category is required'),
  description: z.string().optional(),
  uomId: z.string().uuid('Unit of measure is required'),
  pickStrategy: z.enum(['none', 'fifo', 'fefo']).optional(),
});

export const updateInventoryItemSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  code: z.string().min(1).max(100).optional(),
  type: z.enum(INVENTORY_ITEM_TYPES).optional(),
  description: z.string().nullable().optional(),
  categoryId: z.uuid('Category is required').optional(),
  uomId: z.uuid('Unit of measure is required').optional(),
  pickStrategy: z.enum(['none', 'fifo', 'fefo']).optional(),
});

export type CreateInventoryItemFormData = z.infer<typeof createInventoryItemSchema>;
export type UpdateInventoryItemFormData = z.infer<typeof updateInventoryItemSchema>;
export type InventoryItemsTableResponse = TableResponse<InventoryItemData>;

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

export type InventoryTracking = 'quantity' | 'lot' | 'lot_serial' | 'serial';

export type InventoryPickStrategy = 'none' | 'fifo' | 'fefo';

export const InventoryPickStrategyValues = { NONE: 'none', FIFO: 'fifo', FEFO: 'fefo' } as const;

export interface InventoryItemData {
  id: string;
  name: string;
  code: string;
  type: InventoryItemType;
  tracking: InventoryTracking;
  pickStrategy: InventoryPickStrategy;
  categoryId: string;
  categoryName: string | null;
  description: string | null;
  uomId: string;
  uomSymbol: string | null;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
}

// Per-location stock aggregate for an inventory item — sourced from inventory_item_quants.
// `reorderLevel` is null when the location has stock but no inventory_item_locations row.
export interface InventoryItemStockData {
  locationId: string;
  locationName: string | null;
  locationPath: string | null;
  stockedQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderLevel: number | null;
}
