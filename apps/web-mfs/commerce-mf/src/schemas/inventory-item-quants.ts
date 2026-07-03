import type { TableResponse } from '@vritti/quantum-ui/types/api-response';

export type InventoryItemQuantStatus = 'FRESH' | 'EXPIRING_SOON' | 'EXPIRED';

export interface InventoryItemQuantData {
  id: string;
  inventoryItemId: string;
  locationId: string;
  locationName: string | null;
  locationPath: string | null;
  lotId: string | null;
  lotNumber: string | null;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  manufacturingDate: string | null;
  expiryDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export type InventoryItemQuantsTableResponse = TableResponse<InventoryItemQuantData>;
