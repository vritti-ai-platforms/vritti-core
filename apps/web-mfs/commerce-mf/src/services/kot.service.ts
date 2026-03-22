import type { AxiosResponse } from 'axios';
import axios from '@vritti/quantum-ui/axios';
import type { KotItem } from '../schemas';

interface SuccessResponse {
  success: boolean;
  message: string;
}

// Fetches active KOT items for an org+bu
export function getActiveKotItems(businessUnitId: string): Promise<KotItem[]> {
  return axios
    .get<KotItem[]>('commerce-api/kot', { params: { businessUnitId } })
    .then((r: AxiosResponse<KotItem[]>) => r.data);
}

// Updates a KOT item's status
export function updateKotItemStatus(itemId: string, status: string): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/kot/items/${itemId}/status`, { status })
    .then((r: AxiosResponse<SuccessResponse>) => r.data);
}
