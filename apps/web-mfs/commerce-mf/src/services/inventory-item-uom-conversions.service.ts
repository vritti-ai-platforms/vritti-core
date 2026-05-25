import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type {
  InventoryItemUomConversionData,
  InventoryItemUomConversionsTableResponse,
} from '@/schemas/inventory-item-uom-conversions';

export function getInventoryItemUomConversionsTable(itemId: string): Promise<InventoryItemUomConversionsTableResponse> {
  return axios
    .get<InventoryItemUomConversionsTableResponse>(`commerce-api/inventory-items/${itemId}/uom-conversions/table`)
    .then((r) => r.data);
}

export function createInventoryItemUomConversion(
  itemId: string,
  data: { uomId: string; primaryUomQty: number; uomQty: number },
): Promise<CreateResponse<InventoryItemUomConversionData>> {
  return axios
    .post<CreateResponse<InventoryItemUomConversionData>>(
      `commerce-api/inventory-items/${itemId}/uom-conversions`,
      data,
    )
    .then((r) => r.data);
}

export function updateInventoryItemUomConversion(
  itemId: string,
  conversionId: string,
  data: { primaryUomQty: number; uomQty: number },
): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/inventory-items/${itemId}/uom-conversions/${conversionId}`, data)
    .then((r) => r.data);
}

export function deleteInventoryItemUomConversion(itemId: string, conversionId: string): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`commerce-api/inventory-items/${itemId}/uom-conversions/${conversionId}`)
    .then((r) => r.data);
}
