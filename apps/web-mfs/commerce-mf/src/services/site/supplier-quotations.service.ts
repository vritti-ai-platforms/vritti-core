import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  SupplierQuotationCounts,
  SupplierQuotationData,
  SupplierQuotationDetail,
  SupplierQuotationItemPayload,
  SupplierQuotationPayload,
  SupplierQuotationsTableResponse,
} from '@/schemas/supplier-quotations';

const base = (supplierId: string) => `commerce-api/site/suppliers/${supplierId}/quotations`;

// Fetches the supplier's quotations the session site reads: its own and those posted to it
export function getSupplierQuotationsTable(supplierId: string): Promise<SupplierQuotationsTableResponse> {
  return axios
    .get<SupplierQuotationsTableResponse>(`${base(supplierId)}/table`, { showSuccessToast: false })
    .then((r) => r.data);
}

// Fetches a quotation the session site reads, with its lines
export function getSupplierQuotation(supplierId: string, quotationId: string): Promise<SupplierQuotationDetail> {
  return axios
    .get<SupplierQuotationDetail>(`${base(supplierId)}/${quotationId}`, { showSuccessToast: false })
    .then((r) => r.data);
}

// Fetches how many lines and site postings a quotation the session site reads has, one per tab
export function getSupplierQuotationCounts(supplierId: string, quotationId: string): Promise<SupplierQuotationCounts> {
  return axios
    .get<SupplierQuotationCounts>(`${base(supplierId)}/${quotationId}/counts`, { showSuccessToast: false })
    .then((r) => r.data);
}

// Records a draft quotation the session site owns
export function createSupplierQuotation({
  supplierId,
  data,
}: {
  supplierId: string;
  data: SupplierQuotationPayload;
}): Promise<SupplierQuotationData> {
  return axios.post<CreateResponse<SupplierQuotationData>>(base(supplierId), data).then((r) => r.data.data);
}

// Changes the header of a quotation the session site owns
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

// Deletes a quotation the session site owns
export function deleteSupplierQuotation({
  supplierId,
  quotationId,
}: {
  supplierId: string;
  quotationId: string;
}): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${base(supplierId)}/${quotationId}`).then((r) => r.data);
}

// Adds a line to a quotation the session site owns
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

// Changes a line of a quotation the session site owns
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

// Removes a line from a quotation the session site owns
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

// Posts a quotation the session site owns to the site
export function postSupplierQuotation({
  supplierId,
  quotationId,
}: {
  supplierId: string;
  quotationId: string;
}): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${base(supplierId)}/${quotationId}/posting`).then((r) => r.data);
}

// Removes a quotation posted to the session site, whoever owns it
export function removeSupplierQuotationPosting({
  supplierId,
  quotationId,
}: {
  supplierId: string;
  quotationId: string;
}): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${base(supplierId)}/${quotationId}/posting`).then((r) => r.data);
}
