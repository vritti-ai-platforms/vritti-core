import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z, zodNumericField } from '@vritti/quantum-ui/zod';

export type StockTransferStatus = 'REQUESTED' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED';

export interface StockTransferData {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string;
  fromSiteId: string;
  fromSiteName: string | null;
  toSiteId: string;
  toSiteName: string | null;
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
  inventoryItemId: z.uuid('Inventory item is required'),
  fromSiteId: z.string().min(1, 'Source location is required'),
  toSiteId: z.string().min(1, 'Destination location is required'),
  fromLocationId: z.uuid('From location is required'),
  toLocationId: z.uuid('To location is required'),
  quantity: zodNumericField({ required: 'Quantity is required', positive: true }),
  notes: z.string().optional(),
});

export type CreateStockTransferFormData = z.infer<typeof createStockTransferSchema>;
