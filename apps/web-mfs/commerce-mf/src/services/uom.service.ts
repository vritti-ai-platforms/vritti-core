import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type { CreateUomResponse, UomData } from '@/schemas/uom';

export interface CreateUomPayload {
  name: string;
  symbol: string;
  baseUnitId?: string;
  conversionFactor?: number;
}

export interface UpdateUomPayload {
  name?: string;
  symbol?: string;
  conversionFactor?: number;
}

// Fetches base units, optionally filtered by search
export function listBaseUnits(search?: string): Promise<UomData[]> {
  return axios
    .get<UomData[]>('commerce-api/uom/base', { params: { search: search || undefined }, showSuccessToast: false })
    .then((r) => r.data);
}

// Fetches derived units for a given base unit
export function listDerivedUnits(baseUnitId: string): Promise<UomData[]> {
  return axios
    .get<UomData[]>(`commerce-api/uom/${baseUnitId}/derived`, { showSuccessToast: false })
    .then((r) => r.data);
}

// Creates a new UOM
export function createUom(data: CreateUomPayload): Promise<CreateUomResponse> {
  return axios
    .post<CreateUomResponse>('commerce-api/uom', data)
    .then((r) => r.data);
}

// Updates a UOM by ID
export function updateUom({ id, data }: { id: string; data: UpdateUomPayload }): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/uom/${id}`, data)
    .then((r) => r.data);
}

// Deletes a UOM by ID
export function deleteUom(id: string): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`commerce-api/uom/${id}`)
    .then((r) => r.data);
}
