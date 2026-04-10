import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type { ConversionData, ConversionDetail, ConversionsTableResponse } from '@/schemas/conversions';

export interface CreateConversionPayload {
  bomId?: string;
  notes?: string;
  inputs: { inventoryItemId: string; quantity: number; wastageQuantity?: number }[];
  outputs: { inventoryItemId: string; quantity: number; wastageQuantity?: number }[];
}

export function getConversionsTable(): Promise<ConversionsTableResponse> {
  return axios
    .get<ConversionsTableResponse>('commerce-api/conversions/table', { showSuccessToast: false })
    .then((r) => r.data);
}

export function createConversion(data: CreateConversionPayload): Promise<ConversionData> {
  return axios
    .post<ConversionData>('commerce-api/conversions', data)
    .then((r) => r.data);
}

export function getConversion(id: string): Promise<ConversionDetail> {
  return axios
    .get<ConversionDetail>(`commerce-api/conversions/${id}`, { showSuccessToast: false })
    .then((r) => r.data);
}

export function completeConversion(id: string): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/conversions/${id}/complete`)
    .then((r) => r.data);
}
