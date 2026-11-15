import axios from '@vritti/quantum-ui/axios';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { CreateUomData, CreateUomResponse, UomTableResponse, UpdateUomData } from '@/schemas/uom';

// Fetches UOM table for a dimension with server-side pagination/sorting/filtering
export function getUomTable(dimensionId: string): Promise<UomTableResponse> {
  return axios
    .get<UomTableResponse>(`commerce-api/org/uom/dimension/${dimensionId}/table`, { showSuccessToast: false })
    .then((r) => r.data);
}

// Creates a new UOM
export function createUom(data: CreateUomData): Promise<CreateUomResponse> {
  return axios.post<CreateUomResponse>('commerce-api/org/uom', data).then((r) => r.data);
}

// Updates a UOM by ID
export function updateUom({ id, data }: { id: string; data: UpdateUomData }): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/org/uom/${id}`, data).then((r) => r.data);
}

// Deletes a UOM by ID
export function deleteUom(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/org/uom/${id}`).then((r) => r.data);
}
