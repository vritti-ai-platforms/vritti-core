import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  SupplierQuotationData,
  SupplierQuotationDetail,
  SupplierQuotationItemPayload,
  SupplierQuotationPayload,
  SupplierQuotationsTableResponse,
} from '@/schemas/supplier-quotations';

const base = (supplierId: string) => `commerce-api/le/suppliers/${supplierId}/quotations`;

export function getSupplierQuotationsTable(supplierId: string): Promise<SupplierQuotationsTableResponse> {
  return axios
    .get<SupplierQuotationsTableResponse>(`${base(supplierId)}/table`, { showSuccessToast: false })
    .then((r) => r.data);
}

// Fetches the supplier's quotations posted to the enrollment's site
export function getSupplierEnrollmentQuotationsTable(
  supplierId: string,
  siteId: string,
): Promise<SupplierQuotationsTableResponse> {
  return axios
    .get<SupplierQuotationsTableResponse>(
      `commerce-api/le/suppliers/${supplierId}/enrollments/${siteId}/quotations/table`,
    )
    .then((r) => r.data);
}

export function getSupplierQuotation(supplierId: string, quotationId: string): Promise<SupplierQuotationDetail> {
  return axios
    .get<SupplierQuotationDetail>(`${base(supplierId)}/${quotationId}`, { showSuccessToast: false })
    .then((r) => r.data);
}

export function createSupplierQuotation({
  supplierId,
  data,
}: {
  supplierId: string;
  data: SupplierQuotationPayload;
}): Promise<SupplierQuotationData> {
  return axios.post<CreateResponse<SupplierQuotationData>>(base(supplierId), data).then((r) => r.data.data);
}

export function updateSupplierQuotation({
  supplierId,
  quotationId,
  data,
}: {
  supplierId: string;
  quotationId: string;
  data: Partial<SupplierQuotationPayload>;
}): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${base(supplierId)}/${quotationId}`, data).then((r) => r.data);
}

export function deleteSupplierQuotation({
  supplierId,
  quotationId,
}: {
  supplierId: string;
  quotationId: string;
}): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${base(supplierId)}/${quotationId}`).then((r) => r.data);
}

export function addSupplierQuotationItem({
  supplierId,
  quotationId,
  data,
}: {
  supplierId: string;
  quotationId: string;
  data: SupplierQuotationItemPayload & { inventoryItemId: string; uomId: string };
}): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${base(supplierId)}/${quotationId}/items`, data).then((r) => r.data);
}

export function updateSupplierQuotationItem({
  supplierId,
  quotationId,
  itemId,
  data,
}: {
  supplierId: string;
  quotationId: string;
  itemId: string;
  data: SupplierQuotationItemPayload;
}): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${base(supplierId)}/${quotationId}/items/${itemId}`, data).then((r) => r.data);
}

export function removeSupplierQuotationItem({
  supplierId,
  quotationId,
  itemId,
}: {
  supplierId: string;
  quotationId: string;
  itemId: string;
}): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${base(supplierId)}/${quotationId}/items/${itemId}`).then((r) => r.data);
}

// Posts the quotation to a site, or with no site as the legal entity's prices
export function postSupplierQuotationToSite({
  supplierId,
  quotationId,
  siteId,
}: {
  supplierId: string;
  quotationId: string;
  siteId: string | null;
}): Promise<SuccessResponse> {
  return (
    siteId
      ? axios.post<SuccessResponse>(`${base(supplierId)}/${quotationId}/sites`, { siteId })
      : axios.post<SuccessResponse>(`${base(supplierId)}/${quotationId}/legal-entity`)
  ).then((r) => r.data);
}

// Removes the quotation from a site, or with no site its legal-entity prices
export function removeSupplierQuotationFromSite({
  supplierId,
  quotationId,
  siteId,
}: {
  supplierId: string;
  quotationId: string;
  siteId: string | null;
}): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`${base(supplierId)}/${quotationId}/${siteId ? `sites/${siteId}` : 'legal-entity'}`)
    .then((r) => r.data);
}
