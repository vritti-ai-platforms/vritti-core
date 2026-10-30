import axios from '@vritti/quantum-ui/axios';
import type { CurrencyValue } from '@vritti/quantum-ui/currency';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { SiteSupplierRow, SiteSuppliersTableResponse } from '@/schemas/site-suppliers';
import type {
  SiteSupplierItemDetail,
  SiteSupplierItemsTableResponse,
  SupplierItemPriceHistory,
  SupplierItemPriceRow,
  SupplierItemPricesTableResponse,
} from '@/schemas/suppliers';
import type { PriceRange } from '@/utils/supplierPrice';

const BASE = 'commerce-api/site/suppliers';

export interface EnrollSiteSupplierPayload {
  supplierId: string;
  paymentTermId: string;
  partyTaxRegistrationId: string;
  partyBankAccountId?: string | null;
  orderRelationshipId?: string | null;
}

export interface UpdateSiteEnrollmentPayload {
  paymentTermId?: string;
  partyTaxRegistrationId?: string;
  partyBankAccountId?: string | null;
  orderRelationshipId?: string | null;
}

export interface AddSiteSupplierItemPricePayload {
  unitPrice?: CurrencyValue;
  mrpId?: string;
  schemeBuyQty?: number;
  schemeFreeQty?: number;
  taxInclusive?: boolean;
  validFrom: string;
  validTo?: string | null;
  note?: string;
}

export interface UpdateSiteSupplierItemPricePayload {
  unitPrice?: CurrencyValue;
  mrpId?: string | null;
  schemeBuyQty?: number | null;
  schemeFreeQty?: number | null;
  taxInclusive?: boolean;
  validTo?: string | null;
}

// Fetches the site's enrolled suppliers for the table
export function getSiteSuppliersTable(): Promise<SiteSuppliersTableResponse> {
  return axios.get<SiteSuppliersTableResponse>(`${BASE}/table`, { showSuccessToast: false }).then((r) => r.data);
}

// Enrolls a supplier for the current site
export function enrollSiteSupplier(data: EnrollSiteSupplierPayload): Promise<SiteSupplierRow> {
  return axios.post<CreateResponse<SiteSupplierRow>>(BASE, data).then((r) => r.data.data);
}

// Fetches a single enrolled supplier with the site's enrollment picks
export function getSiteSupplier(id: string): Promise<SiteSupplierRow> {
  return axios.get<SiteSupplierRow>(`${BASE}/${id}`, { showSuccessToast: false }).then((r) => r.data);
}

// Updates the site's enrollment picks for a supplier
export function updateSiteEnrollment({
  supplierId,
  data,
}: {
  supplierId: string;
  data: UpdateSiteEnrollmentPayload;
}): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${supplierId}/enrollment`, data).then((r) => r.data);
}

// Removes the site's enrollment for a supplier
export function unenrollSiteSupplier(supplierId: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${supplierId}/enrollment`).then((r) => r.data);
}

// Fetches an enrolled supplier's items for the table
export function getSiteSupplierItemsTable(supplierId: string): Promise<SiteSupplierItemsTableResponse> {
  return axios
    .get<SiteSupplierItemsTableResponse>(`${BASE}/${supplierId}/items/table`, { showSuccessToast: false })
    .then((r) => r.data);
}

// Fetches a single enrolled supplier item
export function getSiteSupplierItem({
  supplierId,
  itemId,
}: {
  supplierId: string;
  itemId: string;
}): Promise<SiteSupplierItemDetail> {
  return axios
    .get<SiteSupplierItemDetail>(`${BASE}/${supplierId}/items/${itemId}`, { showSuccessToast: false })
    .then((r) => r.data);
}

export interface UpdateSiteSupplierItemTermsPayload {
  isPreferred?: boolean;
  leadTimeDays?: number | null;
  followItemLeadTime?: boolean;
}

// Updates this site's terms for a supplier item
export function updateSiteSupplierItemTerms({
  supplierId,
  itemId,
  rowId,
  data,
}: {
  supplierId: string;
  itemId: string;
  rowId: string;
  data: UpdateSiteSupplierItemTermsPayload;
}): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${supplierId}/items/${itemId}/sites/${rowId}`, data).then((r) => r.data);
}

// Fetches the price timeline visible to this site for a supplier item
export function getSiteSupplierItemPricesTable({
  supplierId,
  itemId,
}: {
  supplierId: string;
  itemId: string;
}): Promise<SupplierItemPricesTableResponse> {
  return axios
    .get<SupplierItemPricesTableResponse>(`${BASE}/${supplierId}/items/${itemId}/prices/table`, {
      showSuccessToast: false,
    })
    .then((r) => r.data);
}

// Fetches this site's price windows for a supplier item — unpaged, for charts
export function getSiteSupplierItemPriceHistory({
  supplierId,
  itemId,
  range,
}: {
  supplierId: string;
  itemId: string;
  range: PriceRange;
}): Promise<SupplierItemPriceHistory> {
  return axios
    .get<SupplierItemPriceHistory>(`${BASE}/${supplierId}/items/${itemId}/prices/history`, {
      params: { from: range.from, to: range.to },
      showSuccessToast: false,
    })
    .then((r) => r.data);
}

// Adds a site-specific price record to a supplier item's timeline
export function addSiteSupplierItemPrice({
  supplierId,
  itemId,
  data,
}: {
  supplierId: string;
  itemId: string;
  data: AddSiteSupplierItemPricePayload;
}): Promise<SupplierItemPriceRow[]> {
  return axios
    .post<CreateResponse<SupplierItemPriceRow[]>>(`${BASE}/${supplierId}/items/${itemId}/prices`, data)
    .then((r) => r.data.data);
}

// Updates a site-specific supplier item price record
export function updateSiteSupplierItemPrice({
  supplierId,
  itemId,
  priceId,
  data,
}: {
  supplierId: string;
  itemId: string;
  priceId: string;
  data: UpdateSiteSupplierItemPricePayload;
}): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`${BASE}/${supplierId}/items/${itemId}/prices/${priceId}`, data)
    .then((r) => r.data);
}

// Deletes a site-specific supplier item price record
export function deleteSiteSupplierItemPrice({
  supplierId,
  itemId,
  priceId,
}: {
  supplierId: string;
  itemId: string;
  priceId: string;
}): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${supplierId}/items/${itemId}/prices/${priceId}`).then((r) => r.data);
}
