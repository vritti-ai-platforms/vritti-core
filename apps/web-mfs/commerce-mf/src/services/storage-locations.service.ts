import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type {
	CreateLocationResponse,
	StorageLocationData,
	LocationFormData,
	ReorderLocationsData,
	StorageLocationCountData,
	StorageLocationChildrenTableResponse,
	UpdateLocationData,
	StorageLocationTreeNode,
} from '@/schemas/storage-locations';

export function listLocationTree(search?: string): Promise<StorageLocationTreeNode[]> {
	return axios
		.get<StorageLocationTreeNode[]>('commerce-api/storage-locations/tree', {
			params: search ? { search } : undefined,
		})
		.then((r) => r.data);
}

export function getLocationCount(): Promise<StorageLocationCountData> {
	return axios.get<StorageLocationCountData>('commerce-api/storage-locations/count').then((r) => r.data);
}

export function getLocationChildrenTable(parentId: string): Promise<StorageLocationChildrenTableResponse> {
	return axios.get<StorageLocationChildrenTableResponse>(`commerce-api/storage-locations/${parentId}/children/table`).then((r) => r.data);
}

export function getLocationById(id: string): Promise<StorageLocationData> {
	return axios.get<StorageLocationData>(`commerce-api/storage-locations/${id}`).then((r) => r.data);
}

export function reorderLocations(data: ReorderLocationsData): Promise<SuccessResponse> {
	return axios.post<SuccessResponse>('commerce-api/storage-locations/reorder', data).then((r) => r.data);
}

export function createLocation(data: LocationFormData): Promise<CreateLocationResponse> {
	return axios.post<CreateLocationResponse>('commerce-api/storage-locations', data).then((r) => r.data);
}

export function updateLocation({ id, data }: { id: string; data: UpdateLocationData }): Promise<SuccessResponse> {
	return axios.patch<SuccessResponse>(`commerce-api/storage-locations/${id}`, data).then((r) => r.data);
}

export function deleteLocation(id: string): Promise<SuccessResponse> {
	return axios.delete<SuccessResponse>(`commerce-api/storage-locations/${id}`).then((r) => r.data);
}
