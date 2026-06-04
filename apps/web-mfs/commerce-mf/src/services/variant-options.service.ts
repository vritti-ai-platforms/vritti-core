import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type { VariantOption, VariantOptionData } from '@/schemas/variant-options';

// Lists the variant options (dimensions) defined on a catalog
export function listVariantOptions(catalogId: string): Promise<VariantOption[]> {
  return axios
    .get<VariantOption[]>(`commerce-api/catalogs/${catalogId}/variant-options`, { showSuccessToast: false })
    .then((r) => r.data);
}

// Creates a variant option (name + values) on a catalog
export function createVariantOption({
  catalogId,
  data,
}: {
  catalogId: string;
  data: { name: string; values: string[] };
}): Promise<VariantOption> {
  return axios.post<VariantOption>(`commerce-api/catalogs/${catalogId}/variant-options`, data).then((r) => r.data);
}

// Updates a variant option's name and/or values
export function updateVariantOption({
  catalogId,
  optionId,
  data,
}: {
  catalogId: string;
  optionId: string;
  data: VariantOptionData;
}): Promise<VariantOption> {
  return axios
    .patch<VariantOption>(`commerce-api/catalogs/${catalogId}/variant-options/${optionId}`, data)
    .then((r) => r.data);
}

// Deletes a variant option from a catalog
export function deleteVariantOption({
  catalogId,
  optionId,
}: {
  catalogId: string;
  optionId: string;
}): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`commerce-api/catalogs/${catalogId}/variant-options/${optionId}`)
    .then((r) => r.data);
}
