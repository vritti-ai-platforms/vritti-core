import type { TableResponse } from '@vritti/quantum-ui/api-response';
import type { StockAdjustmentsTableResponse } from './stock-adjustments';

export type InventoryItemBatchStatus = 'FRESH' | 'EXPIRING_SOON' | 'EXPIRED';

export interface InventoryItemBatchData {
  id: string;
  inventoryItemId: string;
  locationId: string;
  locationName: string | null;
  batchNumber: string | null;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  manufacturingDate: string | null;
  expiryDate: string | null;
  goodsReceiptItemId: string | null;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BatchLedgerData {
  id: string;
  batchId: string | null;
  type: string;
  quantity: number;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  createdAt: string;
}

export type InventoryItemBatchesTableResponse = TableResponse<InventoryItemBatchData>;
export type BatchLedgerTableResponse = TableResponse<BatchLedgerData>;
export type { StockAdjustmentsTableResponse };
