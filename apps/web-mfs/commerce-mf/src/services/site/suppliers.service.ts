import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  CreateSupplierEnrollmentPayload,
  SetSupplierEnrollmentActiveVars,
  SupplierEnrollment,
  SupplierEnrollmentDetail,
  SupplierEnrollmentKey,
  SupplierEnrollmentsTableResponse,
  UpdateSupplierEnrollmentVars,
} from '@/schemas/supplier-enrollments';
import type {
  AddSupplierSiteItemPricePayload,
  SupplierItemPriceHistory,
  SupplierItemPriceRow,
  SupplierSiteItemDataTableResponse,
  SupplierSiteItemDetail,
  SupplierSiteItemPricesTableResponse,
  UpdateSupplierSiteItemPayload,
  UpdateSupplierSiteItemPricePayload,
} from '@/schemas/suppliers';

const BASE = 'commerce-api/site/suppliers';

// Fetches every supplier of the legal entity with its enrollment at the session site
export function getSupplierEnrollmentsTable(): Promise<SupplierEnrollmentsTableResponse> {
  return axios.get<SupplierEnrollmentsTableResponse>(`${BASE}/table`).then((r) => r.data);
}

// Fetches a supplier as the session site sees it, enrolled there or not
export function getSupplierEnrollment({
  supplierId,
}: Pick<SupplierEnrollmentKey, 'supplierId'>): Promise<SupplierEnrollmentDetail> {
  return axios.get<SupplierEnrollmentDetail>(`${BASE}/${supplierId}`).then((r) => r.data);
}

// Enrolls a supplier at the session site; the site travels in the request headers
export function createSupplierEnrollment({
  siteId: _siteId,
  ...data
}: CreateSupplierEnrollmentPayload): Promise<SupplierEnrollment> {
  return axios.post<CreateResponse<SupplierEnrollment>>(BASE, data).then((r) => r.data.data);
}

// Updates a supplier's enrollment at the session site
export function updateSupplierEnrollment({ supplierId, data }: UpdateSupplierEnrollmentVars): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${supplierId}`, data).then((r) => r.data);
}

// Activates or deactivates a supplier's enrollment at the session site
export function setSupplierEnrollmentActive({
  supplierId,
  isActive,
}: SetSupplierEnrollmentActiveVars): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${supplierId}/active`, { isActive }).then((r) => r.data);
}

// Removes a supplier's enrollment at the session site
export function deleteSupplierEnrollment({ supplierId }: SupplierEnrollmentKey): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${supplierId}`).then((r) => r.data);
}

// Fetches an enrolled supplier's items as set up at this site, for the table
export function getSupplierSiteItemsTable(supplierId: string): Promise<SupplierSiteItemDataTableResponse> {
  return axios
    .get<SupplierSiteItemDataTableResponse>(`${BASE}/${supplierId}/site-items/table`, { showSuccessToast: false })
    .then((r) => r.data);
}

// Fetches a supplier item as set up at this site
export function getSupplierSiteItem({
  supplierId,
  itemId,
}: {
  supplierId: string;
  itemId: string;
}): Promise<SupplierSiteItemDetail> {
  return axios
    .get<SupplierSiteItemDetail>(`${BASE}/${supplierId}/site-items/${itemId}`, { showSuccessToast: false })
    .then((r) => r.data);
}

// Updates this site's terms for a supplier item
export function updateSupplierSiteItem({
  supplierId,
  supplierSiteItemId,
  data,
}: {
  supplierId: string;
  supplierSiteItemId: string;
  data: UpdateSupplierSiteItemPayload;
}): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`${BASE}/${supplierId}/site-items/${supplierSiteItemId}`, data)
    .then((r) => r.data);
}

// Fetches the price timeline visible to this site for a supplier item
export function getSupplierSiteItemPricesTable({
  supplierId,
  itemId,
}: {
  supplierId: string;
  itemId: string;
}): Promise<SupplierSiteItemPricesTableResponse> {
  return axios
    .get<SupplierSiteItemPricesTableResponse>(`${BASE}/${supplierId}/site-items/${itemId}/prices/table`, {
      showSuccessToast: false,
    })
    .then((r) => r.data);
}

// Fetches this site's price windows for a supplier item in a date range — unpaged, for charts
export function getSupplierSiteItemPriceHistory(supplierId: string, itemId: string): Promise<SupplierItemPriceHistory> {
  return axios
    .get<SupplierItemPriceHistory>(`${BASE}/${supplierId}/site-items/${itemId}/price-history`, {
      showSuccessToast: false,
    })
    .then((r) => r.data);
}

// Adds a site-specific price record to a supplier item's timeline
export function addSupplierSiteItemPrice({
  supplierId,
  itemId,
  data,
}: {
  supplierId: string;
  itemId: string;
  data: AddSupplierSiteItemPricePayload;
}): Promise<SupplierItemPriceRow[]> {
  return axios
    .post<CreateResponse<SupplierItemPriceRow[]>>(`${BASE}/${supplierId}/site-items/${itemId}/prices`, data)
    .then((r) => r.data.data);
}

// Updates a site-specific supplier item price record
export function updateSupplierSiteItemPrice({
  supplierId,
  itemId,
  priceId,
  data,
}: {
  supplierId: string;
  itemId: string;
  priceId: string;
  data: UpdateSupplierSiteItemPricePayload;
}): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`${BASE}/${supplierId}/site-items/${itemId}/prices/${priceId}`, data)
    .then((r) => r.data);
}

// Deletes a site-specific supplier item price record
export function deleteSupplierSiteItemPrice({
  supplierId,
  itemId,
  priceId,
}: {
  supplierId: string;
  itemId: string;
  priceId: string;
}): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`${BASE}/${supplierId}/site-items/${itemId}/prices/${priceId}`)
    .then((r) => r.data);
}
