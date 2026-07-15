import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { InventoryItemMrpData, UpsertInventoryItemMrpFormData } from '@/schemas/inventory-item-mrp';
import type {
  CreateOrgInventoryItemFormData,
  InventoryItemData,
  InventoryItemTableResponse,
  UpdateOrgInventoryItemFormData,
} from '@/schemas/inventory-items';
import type { InventoryItemSuppliersTableResponse } from '@/schemas/suppliers';

const BASE = 'commerce-api/org/inventory-items';

export function getOrgInventoryItemsTable(): Promise<InventoryItemTableResponse> {
  return axios.get<InventoryItemTableResponse>(`${BASE}/table`).then((r) => r.data);
}

export function createOrgInventoryItem(
  data: CreateOrgInventoryItemFormData,
): Promise<CreateResponse<InventoryItemData>> {
  return axios.post<CreateResponse<InventoryItemData>>(BASE, data).then((r) => r.data);
}

export function getOrgInventoryItem(id: string): Promise<InventoryItemData> {
  return axios.get<InventoryItemData>(`${BASE}/${id}`).then((r) => r.data);
}

export function updateOrgInventoryItem({
  id,
  data,
}: {
  id: string;
  data: UpdateOrgInventoryItemFormData;
}): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${id}`, data).then((r) => r.data);
}

export function deleteOrgInventoryItem(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${id}`).then((r) => r.data);
}

export function getOrgInventoryItemMrp(id: string): Promise<InventoryItemMrpData[]> {
  return axios.get<InventoryItemMrpData[]>(`${BASE}/${id}/mrp`, { showSuccessToast: false }).then((r) => r.data);
}

export function upsertOrgInventoryItemMrp(
  id: string,
  data: UpsertInventoryItemMrpFormData,
): Promise<InventoryItemMrpData> {
  return axios.post<InventoryItemMrpData>(`${BASE}/${id}/mrp`, data).then((r) => r.data);
}

export function getOrgInventoryItemSuppliersTable(id: string): Promise<InventoryItemSuppliersTableResponse> {
  return axios
    .get<InventoryItemSuppliersTableResponse>(`${BASE}/${id}/suppliers/table`, { showSuccessToast: false })
    .then((r) => r.data);
}
