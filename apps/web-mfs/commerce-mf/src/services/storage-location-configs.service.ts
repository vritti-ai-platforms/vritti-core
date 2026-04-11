import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type { StorageLocationConfigData, StorageLocationConfigsTableResponse } from '@/schemas/storage-location-configs';

export function getStorageLocationConfigsTable(itemId: string): Promise<StorageLocationConfigsTableResponse> {
  return axios.get<StorageLocationConfigsTableResponse>(`commerce-api/inventory-items/${itemId}/storage-location-configs/table`).then((r) => r.data);
}

export function createStorageLocationConfig(
  itemId: string,
  data: { locationId: string; reorderLevel: number },
): Promise<CreateResponse<StorageLocationConfigData>> {
  return axios.post<CreateResponse<StorageLocationConfigData>>(`commerce-api/inventory-items/${itemId}/storage-location-configs`, data).then((r) => r.data);
}

export function updateStorageLocationConfig(
  itemId: string,
  configId: string,
  data: { reorderLevel: number },
): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/inventory-items/${itemId}/storage-location-configs/${configId}`, data).then((r) => r.data);
}

export function deleteStorageLocationConfig(itemId: string, configId: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/inventory-items/${itemId}/storage-location-configs/${configId}`).then((r) => r.data);
}
