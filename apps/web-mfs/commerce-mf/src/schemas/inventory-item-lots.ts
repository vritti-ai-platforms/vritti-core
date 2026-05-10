import type { TableResponse } from '@vritti/quantum-ui/api-response';

export type InventoryItemLotStatus = 'FRESH' | 'EXPIRING_SOON' | 'EXPIRED';

export interface InventoryItemLotData {
  id: string;
  inventoryItemId: string;
  lotNumber: string;
  manufacturingDate: string | null;
  expiryDate: string;
  stockedQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export type InventoryItemLotsTableResponse = TableResponse<InventoryItemLotData>;
