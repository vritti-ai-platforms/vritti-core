import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  InventoryItemUomConversionData,
  InventoryItemUomConversionsTableResponse,
} from '@/schemas/inventory-item-uom-conversions';

export function getInventoryItemUomConversionsTable(
  inventoryItemId: string,
): Promise<InventoryItemUomConversionsTableResponse> {
  return axios
    .get<InventoryItemUomConversionsTableResponse>(
      `commerce-api/inventory-items/${inventoryItemId}/uom-conversions/table`,
    )
    .then((r) => r.data);
}

export function createInventoryItemUomConversion(
  inventoryItemId: string,
  data: { uomId: string; primaryUomQty: number; uomQty: number },
): Promise<CreateResponse<InventoryItemUomConversionData>> {
  return axios
    .post<CreateResponse<InventoryItemUomConversionData>>(
      `commerce-api/inventory-items/${inventoryItemId}/uom-conversions`,
      data,
    )
    .then((r) => r.data);
}

export function updateInventoryItemUomConversion(
  inventoryItemId: string,
  conversionId: string,
  data: { primaryUomQty: number; uomQty: number },
): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/inventory-items/${inventoryItemId}/uom-conversions/${conversionId}`, data)
    .then((r) => r.data);
}

export function deleteInventoryItemUomConversion(
  inventoryItemId: string,
  conversionId: string,
): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`commerce-api/inventory-items/${inventoryItemId}/uom-conversions/${conversionId}`)
    .then((r) => r.data);
}
