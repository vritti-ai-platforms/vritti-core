import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type { InventoryItemQuantData, QuantLedgerTableResponse } from '@/schemas/inventory-item-quants';

export function getInventoryItemQuant(id: string): Promise<InventoryItemQuantData> {
  return axios.get<InventoryItemQuantData>(`commerce-api/inventory-item-quants/${id}`).then((r) => r.data);
}

export function deleteInventoryItemQuant(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/inventory-item-quants/${id}`).then((r) => r.data);
}

export function getInventoryItemQuantLedgerTable(quantId: string): Promise<QuantLedgerTableResponse> {
  return axios
    .get<QuantLedgerTableResponse>(`commerce-api/inventory-item-quants/${quantId}/ledger/table`)
    .then((r) => r.data);
}
