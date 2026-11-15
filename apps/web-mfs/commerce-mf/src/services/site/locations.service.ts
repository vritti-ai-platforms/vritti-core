import axios from '@vritti/quantum-ui/axios';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  CreateLocationData,
  CreateLocationResponse,
  LocationChildrenTableResponse,
  LocationCountData,
  LocationData,
  LocationItemQuantRow,
  LocationItemsTableResponse,
  LocationTreeNode,
  ReorderLocationsData,
  UpdateLocationData,
} from '@/schemas/locations';

export function listLocationTree(search?: string): Promise<LocationTreeNode[]> {
  return axios
    .get<LocationTreeNode[]>('commerce-api/site/locations/tree', {
      params: search ? { search } : undefined,
    })
    .then((r) => r.data);
}

export function getLocationCount(): Promise<LocationCountData> {
  return axios.get<LocationCountData>('commerce-api/site/locations/count').then((r) => r.data);
}

export function getLocationChildrenTable(parentId: string): Promise<LocationChildrenTableResponse> {
  return axios
    .get<LocationChildrenTableResponse>(`commerce-api/site/locations/${parentId}/children/table`)
    .then((r) => r.data);
}

export function getLocationItemsTable(locationId: string): Promise<LocationItemsTableResponse> {
  return axios
    .get<LocationItemsTableResponse>(`commerce-api/site/locations/${locationId}/items/table`)
    .then((r) => r.data);
}

export function getLocationItemQuants(locationId: string, itemId: string): Promise<LocationItemQuantRow[]> {
  return axios
    .get<LocationItemQuantRow[]>(`commerce-api/site/locations/${locationId}/items/${itemId}/quants`)
    .then((r) => r.data);
}

export function getLocationById(id: string): Promise<LocationData> {
  return axios.get<LocationData>(`commerce-api/site/locations/${id}`).then((r) => r.data);
}

export function reorderLocations(data: ReorderLocationsData): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>('commerce-api/site/locations/reorder', data).then((r) => r.data);
}

export function createLocation(data: CreateLocationData): Promise<CreateLocationResponse> {
  return axios.post<CreateLocationResponse>('commerce-api/site/locations', data).then((r) => r.data);
}

export function updateLocation({ id, data }: { id: string; data: UpdateLocationData }): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/site/locations/${id}`, data).then((r) => r.data);
}

export function deleteLocation(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/site/locations/${id}`).then((r) => r.data);
}
