import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type {
  CreateLocationResponse,
  LocationChildrenTableResponse,
  LocationCountData,
  LocationData,
  LocationFormData,
  LocationItemQuantRow,
  LocationItemsTableResponse,
  LocationTreeNode,
  ReorderLocationsData,
  UpdateLocationData,
} from '@/schemas/locations';

export function listLocationTree(search?: string): Promise<LocationTreeNode[]> {
  return axios
    .get<LocationTreeNode[]>('commerce-api/locations/tree', {
      params: search ? { search } : undefined,
    })
    .then((r) => r.data);
}

export function getLocationCount(): Promise<LocationCountData> {
  return axios.get<LocationCountData>('commerce-api/locations/count').then((r) => r.data);
}

export function getLocationChildrenTable(parentId: string): Promise<LocationChildrenTableResponse> {
  return axios
    .get<LocationChildrenTableResponse>(`commerce-api/locations/${parentId}/children/table`)
    .then((r) => r.data);
}

export function getLocationItemsTable(locationId: string): Promise<LocationItemsTableResponse> {
  return axios.get<LocationItemsTableResponse>(`commerce-api/locations/${locationId}/items/table`).then((r) => r.data);
}

export function getLocationItemQuants(locationId: string, itemId: string): Promise<LocationItemQuantRow[]> {
  return axios
    .get<LocationItemQuantRow[]>(`commerce-api/locations/${locationId}/items/${itemId}/quants`)
    .then((r) => r.data);
}

export function getLocationById(id: string): Promise<LocationData> {
  return axios.get<LocationData>(`commerce-api/locations/${id}`).then((r) => r.data);
}

export function reorderLocations(data: ReorderLocationsData): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>('commerce-api/locations/reorder', data).then((r) => r.data);
}

export function createLocation(data: LocationFormData): Promise<CreateLocationResponse> {
  return axios.post<CreateLocationResponse>('commerce-api/locations', data).then((r) => r.data);
}

export function updateLocation({ id, data }: { id: string; data: UpdateLocationData }): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/locations/${id}`, data).then((r) => r.data);
}

export function deleteLocation(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/locations/${id}`).then((r) => r.data);
}
