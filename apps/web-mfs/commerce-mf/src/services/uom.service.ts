import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type { UomData, UomTableResponse } from '@/schemas/uom';

export interface CreateUomPayload {
  name: string;
  symbol: string;
  baseUnitId?: string;
  conversionFactor?: number;
}

export interface UpdateUomPayload {
  name?: string;
  symbol?: string;
  baseUnitId?: string | null;
  conversionFactor?: number;
}

// Fetches UOMs for the data table — server applies filter/sort state
export function getUomTable(): Promise<UomTableResponse> {
  return axios
    .get<UomTableResponse>('commerce-api/uom/table', { showSuccessToast: false })
    .then((r) => r.data);
}

// Fetches all UOMs as a simple list (for dropdowns in forms)
export function listUom(): Promise<UomData[]> {
  return axios
    .get<UomTableResponse>('commerce-api/uom/table', { showSuccessToast: false })
    .then((r) => r.data.result);
}

// Creates a new UOM
export function createUom(data: CreateUomPayload): Promise<UomData> {
  return axios
    .post<UomData>('commerce-api/uom', data)
    .then((r) => r.data);
}

// Updates a UOM by ID
export function updateUom({ id, data }: { id: string; data: UpdateUomPayload }): Promise<UomData> {
  return axios
    .patch<UomData>(`commerce-api/uom/${id}`, data)
    .then((r) => r.data);
}

// Deletes a UOM by ID
export function deleteUom(id: string): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`commerce-api/uom/${id}`)
    .then((r) => r.data);
}
