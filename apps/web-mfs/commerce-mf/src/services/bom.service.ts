import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type { BomData, BomDetail, BomTableResponse } from '@/schemas/bom';

export interface CreateBomPayload {
  name: string;
  code: string;
  isActive?: boolean;
  lines?: { inventoryItemId: string; requiredQuantity: number }[];
}

export interface UpdateBomPayload {
  name?: string;
  code?: string;
  isActive?: boolean;
  lines?: { inventoryItemId: string; requiredQuantity: number }[];
}

// Fetches BOMs for the data table
export function getBomTable(): Promise<BomTableResponse> {
  return axios
    .get<BomTableResponse>('commerce-api/bom/table', { showSuccessToast: false })
    .then((r) => r.data);
}

// Creates a new BOM with lines
export function createBom(data: CreateBomPayload): Promise<BomDetail> {
  return axios
    .post<BomDetail>('commerce-api/bom', data)
    .then((r) => r.data);
}

// Fetches BOM detail with lines
export function getBom(id: string): Promise<BomDetail> {
  return axios
    .get<BomDetail>(`commerce-api/bom/${id}`, { showSuccessToast: false })
    .then((r) => r.data);
}

// Updates a BOM and replaces lines if provided
export function updateBom({ id, data }: { id: string; data: UpdateBomPayload }): Promise<BomDetail> {
  return axios
    .patch<BomDetail>(`commerce-api/bom/${id}`, data)
    .then((r) => r.data);
}

// Deletes a BOM
export function deleteBom(id: string): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`commerce-api/bom/${id}`)
    .then((r) => r.data);
}
