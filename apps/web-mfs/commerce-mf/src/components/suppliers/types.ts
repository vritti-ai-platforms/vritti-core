import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import type { ChartQueryOptions } from '@vritti/quantum-ui/Chart';
import type { SuccessResponse, TableResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type {
  CreateSupplierEnrollmentPayload,
  EnrollmentPurchasing,
  SetSupplierEnrollmentActiveVars,
  SupplierEnrollment,
  SupplierEnrollmentDetail,
  SupplierEnrollmentKey,
  SupplierEnrollmentsTableResponse,
  SupplierParty,
  UpdateEnrollmentPurchasingVars,
  UpdateSupplierEnrollmentVars,
} from '@/schemas/supplier-enrollments';
import type {
  SupplierQuotationData,
  SupplierQuotationDetail,
  SupplierQuotationItemPayload,
  SupplierQuotationPayload,
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
export type UseEnrollmentPurchasing = (key: SupplierEnrollmentKey) => { data: EnrollmentPurchasing | null };
export type UseUpdateEnrollmentPurchasing = (
  options?: MutationOptions<SuccessResponse, UpdateEnrollmentPurchasingVars>,
) => MutationResult<SuccessResponse, UpdateEnrollmentPurchasingVars>;

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

// The supplier's default currency and every currency it trades in, which a quotation is priced in one of
export type UseSupplierCurrencies = (supplierId: string) => { currencyCode: string; currencyCodes: string[] };
export type AddQuotationItemVars = SupplierQuotationItemPayload & { inventoryItemId: string; uomId: string };
export interface UpdateQuotationItemVars {
  itemId: string;
  data: SupplierQuotationItemPayload;
}
export type UseCreateQuotation = (
  supplierId: string,
  options?: MutationOptions<SupplierQuotationData, SupplierQuotationPayload>,
) => MutationResult<SupplierQuotationData, SupplierQuotationPayload>;
export type UseUpdateQuotation = (
  supplierId: string,
  quotationId: string,
  options?: MutationOptions<SuccessResponse, Partial<SupplierQuotationPayload>>,
) => MutationResult<SuccessResponse, Partial<SupplierQuotationPayload>>;
export type UseDeleteQuotation = (
  supplierId: string,
  options?: MutationOptions<SuccessResponse, string>,
) => MutationResult<SuccessResponse, string>;
export type UseAddQuotationItem = (
  supplierId: string,
  quotationId: string,
  options?: MutationOptions<SuccessResponse, AddQuotationItemVars>,
) => MutationResult<SuccessResponse, AddQuotationItemVars>;
export type UseUpdateQuotationItem = (
  supplierId: string,
  quotationId: string,
  options?: MutationOptions<SuccessResponse, UpdateQuotationItemVars>,
) => MutationResult<SuccessResponse, UpdateQuotationItemVars>;
export type UseRemoveQuotationItem = (
  supplierId: string,
  quotationId: string,
  options?: MutationOptions<SuccessResponse, string>,
) => MutationResult<SuccessResponse, string>;
// Posts a quotation, or removes a posting; `TSite` names the site where the workspace picks one
export type UseQuotationPosting<TSite> = (
  supplierId: string,
  quotationId: string,
  options?: MutationOptions<SuccessResponse, TSite>,
) => MutationResult<SuccessResponse, TSite>;

// The quotation a page is about
export interface QuotationRef {
  supplierId: string;
  quotationId: string;
}
