import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type {
  CostAllocationData,
  CostRowData,
  DistributionMethod,
  GoodsReceiptCostsData,
} from '@/schemas/inventory-item-costs';

export interface AssociateCostPayload {
  categoryId: string;
  totalAmount: { currency: string; value: string };
  distributionMethod: DistributionMethod;
  vendorRef?: string;
  notes?: string;
}

export interface UpdateCostPayload {
  totalAmount?: { currency: string; value: string };
  distributionMethod?: DistributionMethod;
  vendorRef?: string | null;
  notes?: string | null;
}

export function getGoodsReceiptCosts(grId: string): Promise<GoodsReceiptCostsData> {
  return axios
    .get<GoodsReceiptCostsData>(`commerce-api/goods-receipts/${grId}/costs`, { showSuccessToast: false })
    .then((r) => r.data);
}

export function getCostAllocations(grId: string, costId: string): Promise<CostAllocationData[]> {
  return axios
    .get<CostAllocationData[]>(`commerce-api/goods-receipts/${grId}/costs/${costId}/allocations`, {
      showSuccessToast: false,
    })
    .then((r) => r.data);
}

export function associateGoodsReceiptCost({
  grId,
  data,
}: {
  grId: string;
  data: AssociateCostPayload;
}): Promise<CostRowData> {
  return axios.post<CostRowData>(`commerce-api/goods-receipts/${grId}/associate-cost`, data).then((r) => r.data);
}

export function updateGoodsReceiptCost({
  grId,
  costId,
  data,
}: {
  grId: string;
  costId: string;
  data: UpdateCostPayload;
}): Promise<CostRowData> {
  return axios
    .patch<CostRowData>(`commerce-api/goods-receipts/${grId}/costs/${costId}`, data)
    .then((r) => r.data);
}

export function deleteGoodsReceiptCost({
  grId,
  costId,
}: {
  grId: string;
  costId: string;
}): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`commerce-api/goods-receipts/${grId}/costs/${costId}`)
    .then((r) => r.data);
}
