import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { SiteSupplierRow, SiteSuppliersTableResponse } from '@/schemas/site-suppliers';
import type {
  SupplierItemData,
  SupplierItemPriceRow,
  SupplierItemPricesTableResponse,
  SupplierItemsTableResponse,
} from '@/schemas/suppliers';

const BASE = 'commerce-api/site/suppliers';

export interface EnrollSiteSupplierPayload {
  supplierId: string;
  partyTaxRegistrationId?: string | null;
  partyBankAccountId?: string | null;
}

export interface UpdateSiteEnrollmentPayload {
  partyTaxRegistrationId?: string | null;
  partyBankAccountId?: string | null;
  isActive?: boolean;
}

export interface AddSiteSupplierItemPricePayload {
  unitPrice?: { currency: string; value: string };
  schemeBuyQty?: number;
  schemeFreeQty?: number;
  validFrom: string;
  validTo?: string | null;
}

export interface UpdateSiteSupplierItemPricePayload {
  unitPrice?: { currency: string; value: string };
  schemeBuyQty?: number | null;
  schemeFreeQty?: number | null;
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
export function getSiteSupplierItemsTable(supplierId: string): Promise<SupplierItemsTableResponse> {
  return axios
    .get<SupplierItemsTableResponse>(`${BASE}/${supplierId}/items/table`, { showSuccessToast: false })
    .then((r) => r.data);
}

// Fetches a single enrolled supplier item
export function getSiteSupplierItem({
  supplierId,
  itemId,
}: {
  supplierId: string;
  itemId: string;
}): Promise<SupplierItemData> {
  return axios
    .get<SupplierItemData>(`${BASE}/${supplierId}/items/${itemId}`, { showSuccessToast: false })
    .then((r) => r.data);
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

// Adds a site-specific price record to a supplier item's timeline
export function addSiteSupplierItemPrice({
  supplierId,
  itemId,
  data,
}: {
  supplierId: string;
  itemId: string;
  data: AddSiteSupplierItemPricePayload;
}): Promise<SupplierItemPriceRow> {
  return axios
    .post<CreateResponse<SupplierItemPriceRow>>(`${BASE}/${supplierId}/items/${itemId}/prices`, data)
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
