import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  AddInventoryItemStorageTypeFormData,
  CreatedInventoryItemStorageType,
  InventoryItemStorageTypeData,
  UpdateInventoryItemStorageTypeFormData,
} from '@/schemas/inventory-item-storage-types';

const BASE = 'commerce-api/org/inventory-items';

// Lists the storage types an item may be stored in, with its max quantity per location
export function getOrgInventoryItemStorageTypes(inventoryItemId: string): Promise<InventoryItemStorageTypeData[]> {
  return axios.get<InventoryItemStorageTypeData[]>(`${BASE}/${inventoryItemId}/storage-types`).then((r) => r.data);
}

// Allows an item in a storage type with its max quantity per location
export function createOrgInventoryItemStorageType(
  inventoryItemId: string,
  data: AddInventoryItemStorageTypeFormData,
): Promise<CreateResponse<CreatedInventoryItemStorageType>> {
  return axios
    .post<CreateResponse<CreatedInventoryItemStorageType>>(`${BASE}/${inventoryItemId}/storage-types`, data)
    .then((r) => r.data);
}

// Changes an allowed storage type's max quantity per location or its unit
export function updateOrgInventoryItemStorageType(
  inventoryItemId: string,
  rowId: string,
  data: UpdateInventoryItemStorageTypeFormData,
): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${inventoryItemId}/storage-types/${rowId}`, data).then((r) => r.data);
}

// Stops an item from being stored in a storage type
export function deleteOrgInventoryItemStorageType(inventoryItemId: string, rowId: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${inventoryItemId}/storage-types/${rowId}`).then((r) => r.data);
}
