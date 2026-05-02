import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type {
  CreateUomDimensionData,
  UomDimensionData,
  UpdateUomDimensionData,
} from '@/schemas/uom-dimensions';

export function listUomDimensions(search?: string): Promise<UomDimensionData[]> {
  return axios
    .get<UomDimensionData[]>('commerce-api/uom-dimensions', { params: { search: search || undefined } })
    .then((r) => r.data);
}

export function getUomDimension(id: string): Promise<UomDimensionData> {
  return axios.get<UomDimensionData>(`commerce-api/uom-dimensions/${id}`).then((r) => r.data);
}

export function createUomDimension(
  data: CreateUomDimensionData,
): Promise<CreateResponse<UomDimensionData>> {
  return axios
    .post<CreateResponse<UomDimensionData>>('commerce-api/uom-dimensions', data, {
      successMessage: 'Dimension created.',
    })
    .then((r) => r.data);
}

export function updateUomDimension({
  id,
  data,
}: {
  id: string;
  data: UpdateUomDimensionData;
}): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/uom-dimensions/${id}`, data, {
      successMessage: 'Dimension updated.',
    })
    .then((r) => r.data);
}

export function deleteUomDimension(id: string): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`commerce-api/uom-dimensions/${id}`, {
      successMessage: 'Dimension deleted.',
    })
    .then((r) => r.data);
}
