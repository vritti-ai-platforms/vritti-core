import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse, TableResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  TaxJurisdictionCountData,
  TaxJurisdictionData,
  TaxJurisdictionFormData,
  TaxJurisdictionTreeNode,
} from '@/schemas/tax-jurisdictions';

export function getTaxJurisdictionsTree(search?: string): Promise<TaxJurisdictionTreeNode[]> {
  return axios
    .get<TaxJurisdictionTreeNode[]>('commerce-api/tax-jurisdictions/tree', {
      params: search ? { search } : undefined,
      showSuccessToast: false,
    })
    .then((r) => r.data);
}

export function getTaxJurisdictionCount(): Promise<TaxJurisdictionCountData> {
  return axios.get<TaxJurisdictionCountData>('commerce-api/tax-jurisdictions/count').then((r) => r.data);
}

export function getTaxJurisdictionChildrenTable(parentId: string): Promise<TableResponse<TaxJurisdictionData>> {
  return axios
    .get<TableResponse<TaxJurisdictionData>>(`commerce-api/tax-jurisdictions/${parentId}/children/table`)
    .then((r) => r.data);
}

export function getTaxJurisdiction(id: string): Promise<TaxJurisdictionData> {
  return axios.get<TaxJurisdictionData>(`commerce-api/tax-jurisdictions/${id}`).then((r) => r.data);
}

export function createTaxJurisdiction(data: TaxJurisdictionFormData): Promise<CreateResponse<TaxJurisdictionData>> {
  return axios.post<CreateResponse<TaxJurisdictionData>>('commerce-api/tax-jurisdictions', data).then((r) => r.data);
}

export function updateTaxJurisdiction({
  id,
  data,
}: {
  id: string;
  data: Partial<TaxJurisdictionFormData>;
}): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/tax-jurisdictions/${id}`, data).then((r) => r.data);
}

export function deleteTaxJurisdiction(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/tax-jurisdictions/${id}`).then((r) => r.data);
}
