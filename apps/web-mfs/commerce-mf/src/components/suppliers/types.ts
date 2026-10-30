import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { SupplierAtSiteData } from '@/schemas/site-suppliers';
import type {
  SiteSupplierItemDetail,
  SiteSupplierItemsTableResponse,
  SupplierItemPriceHistory,
  SupplierItemPriceRow,
  SupplierItemPricesTableResponse,
} from '@/schemas/suppliers';
import type {
  AddSiteSupplierItemPricePayload,
  UpdateSiteSupplierItemPricePayload,
  UpdateSiteSupplierItemTermsPayload,
} from '@/services/site/suppliers.service';
import type { PriceRange } from '@/utils/supplierPrice';

// A supplier as one site sees it; LE pages carry the site in the URL, site pages use the session site
export interface SupplierSiteRef {
  supplierId: string;
  siteId?: string;
}

export interface SupplierSitePermissions {
  view: string;
  enroll: string;
  editEnroll: string;
  unenroll: string;
  // MRP on the site's prices: view shows it, edit lets it be entered
  mrp: { view: string; edit: string };
  items: { view: string; edit: string };
  prices: { view: string; add: string; edit: string; delete: string };
}

export interface EnrollmentPayload {
  paymentTermId: string;
  partyTaxRegistrationId: string;
  partyBankAccountId: string | null;
  orderRelationshipId: string | null;
}

export interface UpdateEnrollmentVars {
  enrollmentId: string;
  data: EnrollmentPayload;
}

export interface UpdateItemTermsVars {
  rowId: string;
  data: UpdateSiteSupplierItemTermsPayload;
}

export interface UpdateSitePriceVars {
  priceId: string;
  data: UpdateSiteSupplierItemPricePayload;
}

type MutationOptions<TData, TVars> = Omit<UseMutationOptions<TData, AxiosError, TVars>, 'mutationFn'>;
type MutationResult<TData, TVars> = UseMutationResult<TData, AxiosError, TVars>;

export type UseSupplierRef = () => SupplierSiteRef;
export type UseSupplierAtSite = (ref: SupplierSiteRef) => { data: SupplierAtSiteData };
export type UseUpdateEnrollment = (
  ref: SupplierSiteRef,
  options?: MutationOptions<SuccessResponse, UpdateEnrollmentVars>,
) => MutationResult<SuccessResponse, UpdateEnrollmentVars>;
export type UseEnroll = (
  ref: SupplierSiteRef,
  options?: MutationOptions<unknown, EnrollmentPayload>,
) => MutationResult<unknown, EnrollmentPayload>;
export type UseRemoveEnrollment = (
  ref: SupplierSiteRef,
  options?: MutationOptions<SuccessResponse, string>,
) => MutationResult<SuccessResponse, string>;

export type UseSiteItemsTable = (ref: SupplierSiteRef) => {
  data: SiteSupplierItemsTableResponse | undefined;
  isLoading: boolean;
};
export type UseSiteItem = (ref: SupplierSiteRef, itemId: string) => { data: SiteSupplierItemDetail };
export type UseUpdateItemTerms = (
  ref: SupplierSiteRef,
  itemId: string,
  options?: MutationOptions<SuccessResponse, UpdateItemTermsVars>,
) => MutationResult<SuccessResponse, UpdateItemTermsVars>;

export type UseSitePricesTable = (
  ref: SupplierSiteRef,
  itemId: string,
) => { data: SupplierItemPricesTableResponse | undefined; isLoading: boolean };
export type UseSitePriceHistory = (
  ref: SupplierSiteRef,
  itemId: string,
  range: PriceRange,
) => { data: SupplierItemPriceHistory | undefined; isLoading: boolean };
export type UseAddSitePrice = (
  ref: SupplierSiteRef,
  itemId: string,
  options?: MutationOptions<SupplierItemPriceRow[], AddSiteSupplierItemPricePayload>,
) => MutationResult<SupplierItemPriceRow[], AddSiteSupplierItemPricePayload>;
export type UseUpdateSitePrice = (
  ref: SupplierSiteRef,
  itemId: string,
  options?: MutationOptions<SuccessResponse, UpdateSitePriceVars>,
) => MutationResult<SuccessResponse, UpdateSitePriceVars>;
export type UseDeleteSitePrice = (
  ref: SupplierSiteRef,
  itemId: string,
  options?: MutationOptions<SuccessResponse, string>,
) => MutationResult<SuccessResponse, string>;
