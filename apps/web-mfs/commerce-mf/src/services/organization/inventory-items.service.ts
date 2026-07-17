import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  AddInventoryItemMrpFormData,
  InventoryItemMrpData,
  UpdateInventoryItemMrpFormData,
} from '@/schemas/inventory-item-mrp';
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

export function addOrgInventoryItemMrp({
  inventoryItemId,
  data,
}: {
  inventoryItemId: string;
  data: AddInventoryItemMrpFormData;
}): Promise<InventoryItemMrpData> {
  return axios.post<InventoryItemMrpData>(`${BASE}/${inventoryItemId}/mrp`, data).then((r) => r.data);
}

export function updateOrgInventoryItemMrp({
  inventoryItemId,
  mrpId,
  data,
}: {
  inventoryItemId: string;
  mrpId: string;
  data: UpdateInventoryItemMrpFormData;
}): Promise<InventoryItemMrpData> {
  return axios.patch<InventoryItemMrpData>(`${BASE}/${inventoryItemId}/mrp/${mrpId}`, data).then((r) => r.data);
}

export function deleteOrgInventoryItemMrp({
  inventoryItemId,
  mrpId,
}: {
  inventoryItemId: string;
  mrpId: string;
}): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${inventoryItemId}/mrp/${mrpId}`).then((r) => r.data);
}

export function getOrgInventoryItemSuppliersTable(id: string): Promise<InventoryItemSuppliersTableResponse> {
  return axios
    .get<InventoryItemSuppliersTableResponse>(`${BASE}/${id}/suppliers/table`, { showSuccessToast: false })
    .then((r) => r.data);
}
