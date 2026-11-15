import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  CreateInventoryItemLocationFormData,
  InventoryItemLocationData,
  InventoryItemLocationsTableResponse,
} from '@/schemas/inventory-item-locations';

const BASE = 'commerce-api/site/inventory-items';

// Fetches the item's fixed locations at the site
export function getInventoryItemLocationsTable(itemId: string): Promise<InventoryItemLocationsTableResponse> {
  return axios.get<InventoryItemLocationsTableResponse>(`${BASE}/${itemId}/locations/table`).then((r) => r.data);
}

// Assigns the item a fixed location at the site
export function createInventoryItemLocation(
  itemId: string,
  data: CreateInventoryItemLocationFormData,
): Promise<CreateResponse<InventoryItemLocationData>> {
  return axios.post<CreateResponse<InventoryItemLocationData>>(`${BASE}/${itemId}/locations`, data).then((r) => r.data);
}

// Blocks or unblocks new putaway of the item into a fixed location
export function updateInventoryItemLocation(
  itemId: string,
  locationConfigId: string,
  data: { isBlocked: boolean },
): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${itemId}/locations/${locationConfigId}`, data).then((r) => r.data);
}

// Removes a fixed location from the item
export function deleteInventoryItemLocation(itemId: string, locationConfigId: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${itemId}/locations/${locationConfigId}`).then((r) => r.data);
}
