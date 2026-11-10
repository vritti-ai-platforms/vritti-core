import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import type { ChartQueryOptions } from '@vritti/quantum-ui/Chart';
import type { SuccessResponse, TableResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type {
  CreateSupplierEnrollmentPayload,
  SetSupplierEnrollmentActiveVars,
  SupplierEnrollment,
  SupplierEnrollmentDetail,
  SupplierEnrollmentKey,
  SupplierEnrollmentsTableResponse,
  SupplierParty,
  UpdateSupplierEnrollmentVars,
} from '@/schemas/supplier-enrollments';
import type {
  SupplierQuotationData,
  SupplierQuotationDetail,
  SupplierQuotationsTableResponse,
} from '@/schemas/supplier-quotations';
import type {
  AddSupplierSiteItemPricePayload,
  SupplierItemPriceHistory,
  SupplierItemPriceRow,
  SupplierSiteItemDataTableResponse,
  SupplierSiteItemDetail,
  UpdateSupplierSiteItemPricePayload,
  UpdateSupplierSiteItemVars,
} from '@/schemas/suppliers';

// A supplier, and the site when one is in view; LE pages carry the site in the URL, site pages use the session site
export interface SupplierEnrollmentRef {
  supplierId: string;
  siteId?: string;
}

export interface SupplierEnrollmentPermissions {
  view: string;
  enroll: string;
  editEnroll: string;
  unenroll: string;
  siteItems: { view: string; edit: string };
}

export interface SupplierSiteItemPagePermissions {
  editTerms: string;
}

export interface SupplierItemPricesPermissions {
  view: string;
  add: string;
  edit: string;
  delete: string;
  // MRP on a price: view shows it, edit lets it be entered
  mrp: { view: string; edit: string };
}

export interface UpdateSitePriceVars {
  priceId: string;
  data: UpdateSupplierSiteItemPricePayload;
}

type MutationOptions<TData, TVars> = Omit<UseMutationOptions<TData, AxiosError, TVars>, 'mutationFn'>;
type MutationResult<TData, TVars> = UseMutationResult<TData, AxiosError, TVars>;

export type UseEnrollmentRef = () => SupplierEnrollmentKey;
export type UseEnrollmentScope = () => Partial<SupplierEnrollmentKey>;
export type UseEnrollmentsTable = (scope: Partial<SupplierEnrollmentKey>) => {
  data: SupplierEnrollmentsTableResponse | undefined;
  isLoading: boolean;
};
export type UseEnrollment = (key: SupplierEnrollmentKey) => { data: SupplierEnrollmentDetail };
export type UseSupplierParty = (supplierId: string | undefined) => SupplierParty | undefined;
export type UseCreateEnrollment = (
  options?: MutationOptions<SupplierEnrollment, CreateSupplierEnrollmentPayload>,
) => MutationResult<SupplierEnrollment, CreateSupplierEnrollmentPayload>;
export type UseUpdateEnrollment = (
  options?: MutationOptions<SuccessResponse, UpdateSupplierEnrollmentVars>,
) => MutationResult<SuccessResponse, UpdateSupplierEnrollmentVars>;
export type UseSetEnrollmentActive = (
  options?: MutationOptions<SuccessResponse, SetSupplierEnrollmentActiveVars>,
) => MutationResult<SuccessResponse, SetSupplierEnrollmentActiveVars>;
export type UseDeleteEnrollment = (
  options?: MutationOptions<SuccessResponse, SupplierEnrollmentKey>,
) => MutationResult<SuccessResponse, SupplierEnrollmentKey>;

export type UseSiteItemsTable = (ref: SupplierEnrollmentRef) => {
  data: SupplierSiteItemDataTableResponse | undefined;
  isLoading: boolean;
};
export type UseSiteItem = (supplierId: string, itemId: string) => { data: SupplierSiteItemDetail };
export type UseUpdateSiteItem = (
  supplierId: string,
  itemId: string,
  options?: MutationOptions<SuccessResponse, UpdateSupplierSiteItemVars>,
) => MutationResult<SuccessResponse, UpdateSupplierSiteItemVars>;

export type UsePricesTable = (
  supplierId: string,
  itemId: string,
) => { data: TableResponse<SupplierItemPriceRow> | undefined; isLoading: boolean; isFetching: boolean };
export type UsePriceHistoryQuery = (
  supplierId: string,
  itemId: string,
) => ChartQueryOptions<SupplierItemPriceHistory, AxiosError>;
export type UseAddSitePrice = (
  supplierId: string,
  itemId: string,
  options?: MutationOptions<SupplierItemPriceRow[], AddSupplierSiteItemPricePayload>,
) => MutationResult<SupplierItemPriceRow[], AddSupplierSiteItemPricePayload>;
export type UseUpdatePrice = (
  supplierId: string,
  itemId: string,
  options?: MutationOptions<SuccessResponse, UpdateSitePriceVars>,
) => MutationResult<SuccessResponse, UpdateSitePriceVars>;
export type UseDeletePrice = (
  supplierId: string,
  itemId: string,
  options?: MutationOptions<SuccessResponse, string>,
) => MutationResult<SuccessResponse, string>;

export type UseQuotationsTable = (
  supplierId: string,
  siteId: string | undefined,
) => { data: SupplierQuotationsTableResponse | undefined; isLoading: boolean };
export type UseQuotation = (supplierId: string, quotationId: string) => { data: SupplierQuotationDetail };
export type QuotationPath = (quotation: Pick<SupplierQuotationData, 'id' | 'quotationNumber'>) => string;

// The quotation a page is about
export interface QuotationRef {
  supplierId: string;
  quotationId: string;
}

// What an authoring slot on a quotation's page works on
export interface QuotationSlotProps {
  supplierId: string;
  quotation: SupplierQuotationDetail;
}
