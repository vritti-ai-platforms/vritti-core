import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  CreateSupplierEnrollmentPayload,
  LeSupplierEnrollmentDetail,
  SetSupplierEnrollmentActiveVars,
  SupplierEnrollment,
  SupplierEnrollmentCounts,
  SupplierEnrollmentKey,
  SupplierEnrollmentsTableResponse,
  UpdateEnrollmentPurchasingVars,
  UpdateSupplierEnrollmentVars,
} from '@/schemas/supplier-enrollments';
import type { SupplierSiteItemDataTableResponse } from '@/schemas/suppliers';

function base(supplierId: string): string {
  return `commerce-api/le/suppliers/${supplierId}/enrollments`;
}

// Fetches every site of the legal entity with the supplier's enrollment there
export function getSupplierEnrollmentsTable(supplierId: string): Promise<SupplierEnrollmentsTableResponse> {
  return axios.get<SupplierEnrollmentsTableResponse>(`${base(supplierId)}/table`).then((r) => r.data);
}

// Fetches the supplier as one of the legal entity's sites sees it, enrolled there or not, with its purchasing settings
export function getSupplierEnrollment({
  supplierId,
  siteId,
}: SupplierEnrollmentKey): Promise<LeSupplierEnrollmentDetail> {
  return axios.get<LeSupplierEnrollmentDetail>(`${base(supplierId)}/${siteId}`).then((r) => r.data);
}

// Fetches how many items and quotations the supplier has at one of the legal entity's sites, one per tab
export function getSupplierEnrollmentCounts({
  supplierId,
  siteId,
}: SupplierEnrollmentKey): Promise<SupplierEnrollmentCounts> {
  return axios.get<SupplierEnrollmentCounts>(`${base(supplierId)}/${siteId}/counts`).then((r) => r.data);
}

// Enrolls the supplier at one of the legal entity's sites
export function createSupplierEnrollment({
  supplierId,
  ...data
}: CreateSupplierEnrollmentPayload): Promise<SupplierEnrollment> {
  return axios.post<CreateResponse<SupplierEnrollment>>(base(supplierId), data).then((r) => r.data.data);
}

// Updates the supplier's enrollment at a site
export function updateSupplierEnrollment({
  supplierId,
  siteId,
  data,
}: UpdateSupplierEnrollmentVars): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${base(supplierId)}/${siteId}`, data).then((r) => r.data);
}

// Updates how the supplier's purchase legs at a site run: type, approval, quality check, receipt location, tolerances
export function updateSupplierEnrollmentPurchasing({
  supplierId,
  siteId,
  data,
}: UpdateEnrollmentPurchasingVars): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${base(supplierId)}/${siteId}/purchasing`, data).then((r) => r.data);
}

// Activates or deactivates the supplier's enrollment at a site
export function setSupplierEnrollmentActive({
  supplierId,
  siteId,
  isActive,
}: SetSupplierEnrollmentActiveVars): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${base(supplierId)}/${siteId}/active`, { isActive }).then((r) => r.data);
}

// Removes the supplier's enrollment at a site
export function deleteSupplierEnrollment({ supplierId, siteId }: SupplierEnrollmentKey): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${base(supplierId)}/${siteId}`).then((r) => r.data);
}

// Fetches the supplier's items carried by the enrollment's site
export function getSupplierEnrollmentSiteItemsTable({
  supplierId,
  siteId,
}: SupplierEnrollmentKey): Promise<SupplierSiteItemDataTableResponse> {
  return axios
    .get<SupplierSiteItemDataTableResponse>(`${base(supplierId)}/${siteId}/site-items/table`)
    .then((r) => r.data);
}
