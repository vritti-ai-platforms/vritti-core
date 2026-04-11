import type { TableResponse } from '@vritti/quantum-ui/api-response';
import { z } from 'zod';

export type StockTransferStatus = 'REQUESTED' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED';

export interface StockTransferData {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string | null;
  fromBuId: string;
  fromBuName: string | null;
  toBuId: string;
  toBuName: string | null;
  quantity: number;
  status: StockTransferStatus;
  requestedBy: string | null;
  receivedBy: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type StockTransfersTableResponse = TableResponse<StockTransferData>;

export const createStockTransferSchema = z.object({
  inventoryItemId: z.string().min(1, 'Inventory item is required'),
  fromBuId: z.string().min(1, 'Source location is required'),
  toBuId: z.string().min(1, 'Destination location is required'),
  fromLocationId: z.string().min(1, 'From location is required'),
  toLocationId: z.string().min(1, 'To location is required'),
  quantity: z.string().min(1, 'Quantity is required'),
  notes: z.string().optional(),
});

export type CreateStockTransferFormData = z.infer<typeof createStockTransferSchema>;
