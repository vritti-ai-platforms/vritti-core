import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  InventoryItemLocationData,
  InventoryItemLocationsTableResponse,
} from '@/schemas/inventory-item-locations';

const BASE = 'commerce-api/site/inventory-items';

export function getInventoryItemLocationsTable(itemId: string): Promise<InventoryItemLocationsTableResponse> {
  return axios.get<InventoryItemLocationsTableResponse>(`${BASE}/${itemId}/locations/table`).then((r) => r.data);
}

export function createInventoryItemLocation(
  itemId: string,
  data: { locationId: string; reorderLevel: number },
): Promise<CreateResponse<InventoryItemLocationData>> {
  return axios.post<CreateResponse<InventoryItemLocationData>>(`${BASE}/${itemId}/locations`, data).then((r) => r.data);
}

export function updateInventoryItemLocation(
  itemId: string,
  locationConfigId: string,
  data: { reorderLevel: number },
): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${itemId}/locations/${locationConfigId}`, data).then((r) => r.data);
}

export function deleteInventoryItemLocation(itemId: string, locationConfigId: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${itemId}/locations/${locationConfigId}`).then((r) => r.data);
}
