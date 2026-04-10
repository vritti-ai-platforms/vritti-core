import type { TableResponse } from '@vritti/quantum-ui/api-response';
import { z } from 'zod';

export const createInventoryItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  code: z.string().min(1, 'Code is required').max(100),
  type: z.enum(['MATERIAL', 'PRODUCT']),
  description: z.string().optional(),
  uomId: z.string().min(1, 'Unit of measure is required'),
  requiresShipping: z.boolean().optional(),
});

export const updateInventoryItemSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  code: z.string().min(1).max(100).optional(),
  type: z.enum(['MATERIAL', 'PRODUCT']).optional(),
  description: z.string().nullable().optional(),
  uomId: z.string().optional(),
  requiresShipping: z.boolean().optional(),
});

export type CreateInventoryItemFormData = z.infer<typeof createInventoryItemSchema>;
export type UpdateInventoryItemFormData = z.infer<typeof updateInventoryItemSchema>;
export type InventoryItemsTableResponse = TableResponse<InventoryItemData>;

export type InventoryItemType = 'MATERIAL' | 'PRODUCT';

export interface InventoryItemData {
  id: string;
  name: string;
  code: string;
  type: InventoryItemType;
  description: string | null;
  uomId: string;
  uomSymbol: string | null;
  requiresShipping: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryLevelData {
  id: string;
  businessUnitId: string;
  stockedQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderLevel: number;
}

export interface InventoryLedgerData {
  id: string;
  type: string;
  quantity: number;
  balanceAfter: number;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  createdAt: string;
}

export interface InventoryItemDetail extends InventoryItemData {
  levels: InventoryLevelData[];
  ledger: InventoryLedgerData[];
}
