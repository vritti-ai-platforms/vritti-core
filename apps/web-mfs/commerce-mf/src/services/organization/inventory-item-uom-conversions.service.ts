import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  InventoryItemUomConversionData,
  InventoryItemUomConversionsTableResponse,
} from '@/schemas/inventory-item-uom-conversions';

const BASE = 'commerce-api/org/inventory-items';

export function getOrgInventoryItemUomConversionsTable(
  inventoryItemId: string,
): Promise<InventoryItemUomConversionsTableResponse> {
  return axios
    .get<InventoryItemUomConversionsTableResponse>(`${BASE}/${inventoryItemId}/uom-conversions/table`)
    .then((r) => r.data);
}

export function createOrgInventoryItemUomConversion(
  inventoryItemId: string,
  data: { uomId: string; primaryUomQty: number; uomQty: number },
): Promise<CreateResponse<InventoryItemUomConversionData>> {
  return axios
    .post<CreateResponse<InventoryItemUomConversionData>>(`${BASE}/${inventoryItemId}/uom-conversions`, data)
    .then((r) => r.data);
}

export function updateOrgInventoryItemUomConversion(
  inventoryItemId: string,
  conversionId: string,
  data: { primaryUomQty: number; uomQty: number },
): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`${BASE}/${inventoryItemId}/uom-conversions/${conversionId}`, data)
    .then((r) => r.data);
}

export function deleteOrgInventoryItemUomConversion(
  inventoryItemId: string,
  conversionId: string,
): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`${BASE}/${inventoryItemId}/uom-conversions/${conversionId}`)
    .then((r) => r.data);
}
