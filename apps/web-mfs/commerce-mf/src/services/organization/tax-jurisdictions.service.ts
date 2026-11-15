import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse, TableResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  TaxJurisdictionCountData,
  TaxJurisdictionData,
  TaxJurisdictionPayload,
  TaxJurisdictionTreeNode,
  TaxJurisdictionTreeQuery,
} from '@/schemas/tax-jurisdictions';

// The jurisdictions as a tree with states at the top, narrowed to one country when it is given
export function getTaxJurisdictionsTree(query: TaxJurisdictionTreeQuery): Promise<TaxJurisdictionTreeNode[]> {
  return axios
    .get<TaxJurisdictionTreeNode[]>('commerce-api/org/tax-jurisdictions/tree', { params: query })
    .then((r) => r.data);
}

export function getTaxJurisdictionCount(): Promise<TaxJurisdictionCountData> {
  return axios.get<TaxJurisdictionCountData>('commerce-api/org/tax-jurisdictions/count').then((r) => r.data);
}

export function getTaxJurisdictionChildrenTable(parentId: string): Promise<TableResponse<TaxJurisdictionData>> {
  return axios
    .get<TableResponse<TaxJurisdictionData>>(`commerce-api/org/tax-jurisdictions/${parentId}/children/table`)
    .then((r) => r.data);
}

export function getTaxJurisdiction(id: string): Promise<TaxJurisdictionData> {
  return axios.get<TaxJurisdictionData>(`commerce-api/org/tax-jurisdictions/${id}`).then((r) => r.data);
}

export function createTaxJurisdiction(data: TaxJurisdictionPayload): Promise<CreateResponse<TaxJurisdictionData>> {
  return axios
    .post<CreateResponse<TaxJurisdictionData>>('commerce-api/org/tax-jurisdictions', data)
    .then((r) => r.data);
}

export function updateTaxJurisdiction({
  id,
  data,
}: {
  id: string;
  data: TaxJurisdictionPayload;
}): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/org/tax-jurisdictions/${id}`, data).then((r) => r.data);
}

export function deleteTaxJurisdiction(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/org/tax-jurisdictions/${id}`).then((r) => r.data);
}
