import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type {
	CreateLocationResponse,
	StorageLocationData,
	LocationFormData,
	LocationStockData,
	UpdateLocationData,
} from '@/schemas/storage-locations';

export function listLocations(): Promise<StorageLocationData[]> {
	return axios.get<StorageLocationData[]>('commerce-api/storage-locations').then((r) => r.data);
}

export function getLocation(id: string): Promise<StorageLocationData> {
	return axios.get<StorageLocationData>(`commerce-api/storage-locations/${id}`).then((r) => r.data);
}

export function getLocationLevels(id: string): Promise<LocationStockData[]> {
	return axios.get<LocationStockData[]>(`commerce-api/storage-locations/${id}/levels`).then((r) => r.data);
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
