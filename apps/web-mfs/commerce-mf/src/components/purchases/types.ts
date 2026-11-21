import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import type { SelectFilterProps, SelectProps } from '@vritti/quantum-ui/Select';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { DistributiveOmit } from '@vritti/quantum-ui/types/utility';
import type { AxiosError } from 'axios';
import type { ComponentType } from 'react';
import type {
  AddPurchaseAllocationPayload,
  AddPurchaseAllocationsFromQuotationPayload,
  AddPurchaseItemPayload,
  CancelPurchaseLegPayload,
  CancelPurchasePayload,
  ChangePurchaseMinQuotationsPayload,
  ChangePurchaseNotesPayload,
  ClosePurchaseLegPayload,
  ClosePurchasePayload,
  ConfirmPurchaseLegPurchaseOrderPayload,
  CreatedPurchase,
  CreatedPurchaseLegGoodsReceipt,
  CreatedPurchaseLegInboundDelivery,
  CreatedPurchaseLegPurchaseOrders,
  CreatedPurchaseRecord,
  CreatedPurchaseSupplierInvoice,
  CreatePurchaseLegGoodsReceiptPayload,
  CreatePurchaseLegInboundDeliveryPayload,
  CreatePurchaseLegPurchaseOrdersPayload,
  CreatePurchasePayload,
  CreatePurchaseSupplierInvoicePayload,
  DisablePurchaseQuotationsPayload,
  EnablePurchaseQuotationsPayload,
  PurchaseActions,
  PurchaseAllocationRef,
  PurchaseCounts,
  PurchaseDetail,
  PurchaseItemAllocationsTableResponse,
  PurchaseItemComparisonTableResponse,
  PurchaseItemCounts,
  PurchaseItemDocumentsTableResponse,
  PurchaseItemFacets,
  PurchaseItemProgressSummary,
  PurchaseItemQuotesTableResponse,
  PurchaseItemRef,
  PurchaseItemSiteStock,
  PurchaseItemsTableResponse,
  PurchaseItemView,
  PurchaseLeg,
  PurchaseLegCount,
  PurchaseLegRef,
  PurchaseLegsTableResponse,
  PurchaseProgressSummary,
  PurchaseQuotationsTableResponse,
  PurchaseSupplierDocuments,
  PurchasesTableResponse,
  RejectPurchaseLegPayload,
  RequestedPurchaseQuotation,
  RequestPurchaseQuotationPayload,
  UpdatePurchaseAllocationPayload,
  UpdatePurchaseItemPayload,
} from '@/schemas/purchases';
import type {
  CreatedReceiveWithInvoice,
  ReceiveWithInvoiceDetail,
  ReceiveWithInvoiceOpenLine,
  ReceiveWithInvoiceOpenLinesQuery,
  ReceiveWithInvoicePayload,
  UpdateReceiveWithInvoiceVars,
} from '@/schemas/receive-with-invoices';

export interface PurchasePermissions {
  view: string;
  add: string;
  edit: string;
  delete: string;
  approve: string;
  receive: string;
  invoice: string;
  close: string;
  quotations: { view: string; add: string };
}

// The quotation a purchase links to, as far as the Quotations feature needs it to open the quotation
export interface PurchaseQuotationLink {
  supplierId: string;
  supplierName: string;
  quotationId: string;
  quotationNumber?: string;
}

export type PurchaseQuotationPath = (quotation: PurchaseQuotationLink) => string;

export type PurchaseSupplierSelector = ComponentType<DistributiveOmit<SelectProps, 'optionsEndpoint'>>;
export type PurchaseSupplierFilter = ComponentType<
  DistributiveOmit<SelectFilterProps, 'optionsEndpoint' | 'name'> & { name?: string }
>;

type Mutation<TData, TVars> = (
  options?: Omit<UseMutationOptions<TData, AxiosError, TVars>, 'mutationFn'>,
) => UseMutationResult<TData, AxiosError, TVars>;

export type UsePurchasesTable = () => {
  data: PurchasesTableResponse | undefined;
  isLoading: boolean;
  isFetching: boolean;
};
export type UsePurchase = (id: string) => { data: PurchaseDetail };
export type UsePurchaseCounts = (id: string) => { data: PurchaseCounts | undefined; isLoading: boolean };
export type UsePurchaseProgress = (id: string) => { data: PurchaseProgressSummary | undefined; isLoading: boolean };
export type UsePurchaseActions = (id: string) => { data: PurchaseActions | undefined; isLoading: boolean };
type TableQuery<T> = (id: string) => { data: T | undefined; isLoading: boolean; isFetching: boolean };
export type UsePurchaseItemsTable = TableQuery<PurchaseItemsTableResponse>;
export type UsePurchaseItemComparison = TableQuery<PurchaseItemComparisonTableResponse>;
export type UsePurchaseQuotationsTable = TableQuery<PurchaseQuotationsTableResponse>;
export type UsePurchaseSuppliersTable = TableQuery<PurchaseLegsTableResponse>;
export type UsePurchaseItemFacets = (id: string) => { data: PurchaseItemFacets | undefined; isLoading: boolean };
export type UsePurchaseSupplierCounts = (id: string) => { data: PurchaseLegCount[] | undefined; isLoading: boolean };
export type UsePurchaseDocuments = (id: string) => {
  data: PurchaseSupplierDocuments[] | undefined;
  isLoading: boolean;
};
export type UsePurchaseItem = (id: string, itemId: string) => { data: PurchaseItemView };
type ItemQuery<T> = (id: string, itemId: string) => { data: T | undefined; isLoading: boolean };
type ItemTableQuery<T> = (
  id: string,
  itemId: string,
) => { data: T | undefined; isLoading: boolean; isFetching: boolean };
export type UsePurchaseItemCounts = ItemQuery<PurchaseItemCounts>;
export type UsePurchaseItemProgress = ItemQuery<PurchaseItemProgressSummary>;
export type UsePurchaseItemSiteStock = ItemQuery<PurchaseItemSiteStock | null>;
export type UsePurchaseItemAllocationsTable = ItemTableQuery<PurchaseItemAllocationsTableResponse>;
export type UsePurchaseItemQuotesTable = ItemTableQuery<PurchaseItemQuotesTableResponse>;
export type UsePurchaseItemDocumentsTable = ItemTableQuery<PurchaseItemDocumentsTableResponse>;
export type UsePurchaseSupplier = (id: string, legId: string) => { data: PurchaseLeg | undefined; isLoading: boolean };

export type UseCreatePurchase = Mutation<CreateResponse<CreatedPurchase>, CreatePurchasePayload>;
export type UseChangePurchaseNotes = Mutation<SuccessResponse, ChangePurchaseNotesPayload>;
export type UseEnablePurchaseQuotations = Mutation<SuccessResponse, EnablePurchaseQuotationsPayload>;
export type UseDisablePurchaseQuotations = Mutation<SuccessResponse, DisablePurchaseQuotationsPayload>;
export type UseChangePurchaseMinQuotations = Mutation<SuccessResponse, ChangePurchaseMinQuotationsPayload>;
export type UseCancelPurchase = Mutation<SuccessResponse, CancelPurchasePayload>;
export type UseClosePurchase = Mutation<SuccessResponse, ClosePurchasePayload>;
export type UseDeletePurchase = Mutation<SuccessResponse, string>;
export type UsePurchaseAction = Mutation<SuccessResponse, string>;

export type UseAddPurchaseItem = Mutation<CreateResponse<CreatedPurchaseRecord>, AddPurchaseItemPayload>;
export type UseUpdatePurchaseItem = Mutation<SuccessResponse, UpdatePurchaseItemPayload>;
export type UseRemovePurchaseItem = Mutation<SuccessResponse, PurchaseItemRef>;

export type UseRequestPurchaseQuotation = Mutation<
  CreateResponse<RequestedPurchaseQuotation>,
  RequestPurchaseQuotationPayload
>;

export type UseAddPurchaseAllocation = Mutation<CreateResponse<CreatedPurchaseRecord>, AddPurchaseAllocationPayload>;
export type UseAddPurchaseAllocationsFromQuotation = Mutation<
  SuccessResponse,
  AddPurchaseAllocationsFromQuotationPayload
>;
export type UseUpdatePurchaseAllocation = Mutation<SuccessResponse, UpdatePurchaseAllocationPayload>;
export type UseRemovePurchaseAllocation = Mutation<SuccessResponse, PurchaseAllocationRef>;

export type UsePurchaseLegAction = Mutation<SuccessResponse, PurchaseLegRef>;
export type UseRejectPurchaseLeg = Mutation<SuccessResponse, RejectPurchaseLegPayload>;

export type UseCreatePurchaseLegPurchaseOrders = Mutation<
  CreateResponse<CreatedPurchaseLegPurchaseOrders>,
  CreatePurchaseLegPurchaseOrdersPayload
>;
export type UseConfirmPurchaseLegPurchaseOrder = Mutation<SuccessResponse, ConfirmPurchaseLegPurchaseOrderPayload>;
export type UseCreatePurchaseLegInboundDelivery = Mutation<
  CreateResponse<CreatedPurchaseLegInboundDelivery>,
  CreatePurchaseLegInboundDeliveryPayload
>;
export type UseCreatePurchaseLegGoodsReceipt = Mutation<
  CreateResponse<CreatedPurchaseLegGoodsReceipt>,
  CreatePurchaseLegGoodsReceiptPayload
>;
export type UseClosePurchaseLeg = Mutation<SuccessResponse, ClosePurchaseLegPayload>;
export type UseCancelPurchaseLeg = Mutation<SuccessResponse, CancelPurchaseLegPayload>;
export type UseCreatePurchaseSupplierInvoice = Mutation<
  CreateResponse<CreatedPurchaseSupplierInvoice>,
  CreatePurchaseSupplierInvoicePayload
>;

export type UseReceiveWithInvoiceOpenLines = (query: ReceiveWithInvoiceOpenLinesQuery) => {
  data: ReceiveWithInvoiceOpenLine[] | undefined;
  isLoading: boolean;
};
export type UseReceiveWithInvoice = (invoiceId: string) => { data: ReceiveWithInvoiceDetail };
export type UseCreateReceiveWithInvoice = Mutation<
  CreateResponse<CreatedReceiveWithInvoice>,
  ReceiveWithInvoicePayload
>;
export type UseUpdateReceiveWithInvoice = Mutation<SuccessResponse, UpdateReceiveWithInvoiceVars>;
export type UseReceiveWithInvoiceAction = Mutation<SuccessResponse, string>;
