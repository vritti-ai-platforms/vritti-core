import type { TableResponse } from '@vritti/quantum-ui/api-response';

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
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuantLedgerData {
  id: string;
  quantId: string | null;
  type: string;
  quantity: number;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  createdAt: string;
}

export type InventoryItemQuantsTableResponse = TableResponse<InventoryItemQuantData>;
export type QuantLedgerTableResponse = TableResponse<QuantLedgerData>;
