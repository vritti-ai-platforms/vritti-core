import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  CreateStorageTypePayload,
  StorageTypeData,
  StorageTypesTableResponse,
  UpdateStorageTypePayload,
} from '@/schemas/storage-types';

const BASE = 'commerce-api/org/storage-types';

// Fetches the current page of storage types from the saved table state
export function getStorageTypesTable(): Promise<StorageTypesTableResponse> {
  return axios.get<StorageTypesTableResponse>(`${BASE}/table`).then((r) => r.data);
}

// Creates a storage type; its limits are in g / ml / mm
export function createStorageType(data: CreateStorageTypePayload): Promise<CreateResponse<StorageTypeData>> {
  return axios.post<CreateResponse<StorageTypeData>>(BASE, data).then((r) => r.data);
}

// Updates a storage type by ID; its code stays fixed
export function updateStorageType({
  id,
  data,
}: {
  id: string;
  data: UpdateStorageTypePayload;
}): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${id}`, data).then((r) => r.data);
}

// Deletes a storage type no location or item uses
export function deleteStorageType(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${id}`).then((r) => r.data);
}
