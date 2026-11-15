import type {
  InfiniteData,
  UseInfiniteQueryResult,
  UseMutationOptions,
  UseMutationResult,
} from '@tanstack/react-query';
import type { SelectFilterProps, SelectProps } from '@vritti/quantum-ui/Select';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { DistributiveOmit } from '@vritti/quantum-ui/types/utility';
import type { AxiosError } from 'axios';
import type { ComponentType } from 'react';
import type {
  AddPurchaseAllocationPayload,
  AddPurchaseAllocationsFromQuotationPayload,
  AddPurchaseItemPayload,
  CancelPurchasePayload,
  ClosePurchaseLegPayload,
  ConfirmPurchaseLegPurchaseOrderPayload,
  CreatedPurchaseLegGoodsReceipt,
  CreatedPurchaseLegInboundDelivery,
  CreatedPurchaseLegPurchaseOrders,
  CreatedPurchaseSupplierInvoice,
  CreatePurchaseLegGoodsReceiptPayload,
  CreatePurchaseLegInboundDeliveryPayload,
  CreatePurchaseLegPurchaseOrdersPayload,
  CreatePurchasePayload,
  CreatePurchaseSupplierInvoicePayload,
  PurchaseAllocation,
  PurchaseAllocationRef,
  PurchaseData,
  PurchaseEventsQuery,
  PurchaseEventsResponse,
  PurchaseHeader,
  PurchaseItem,
  PurchaseItemRef,
  PurchaseLeg,
  PurchaseLegRef,
  PurchaseQuotation,
  PurchaseSourcingItem,
  PurchasesTableResponse,
  RejectPurchaseLegPayload,
  RequestedPurchaseQuotation,
  RequestPurchaseQuotationPayload,
  UpdatePurchaseAllocationPayload,
  UpdatePurchaseItemPayload,
  UpdatePurchasePayload,
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
}

// The quotation a purchase links to, as far as the Quotations feature needs it to open the quotation
export interface PurchaseQuotationLink {
  supplierId: string;
  supplierName: string;
  quotationId: string;
  quotationNumber?: string;
}

export type PurchaseQuotationPath = (quotation: PurchaseQuotationLink) => string;

export type PurchaseSupplierSelector = ComponentType<Omit<SelectProps, 'optionsEndpoint'>>;
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
export type UsePurchase = (id: string) => { data: PurchaseHeader };
export type UsePurchaseItems = (id: string) => { data: PurchaseItem[] };
export type UsePurchaseQuotations = (id: string) => { data: PurchaseQuotation[] };
export type UsePurchaseSourcingItems = (id: string) => { data: PurchaseSourcingItem[] };
export type UsePurchaseSuppliers = (id: string) => { data: PurchaseLeg[] };
export type UsePurchaseEvents = (
  id: string,
  query: PurchaseEventsQuery,
) => UseInfiniteQueryResult<InfiniteData<PurchaseEventsResponse, number>, AxiosError>;

export type UseCreatePurchase = Mutation<CreateResponse<PurchaseData>, CreatePurchasePayload>;
export type UseUpdatePurchase = Mutation<SuccessResponse, UpdatePurchasePayload>;
export type UseCancelPurchase = Mutation<SuccessResponse, CancelPurchasePayload>;
export type UseDeletePurchase = Mutation<SuccessResponse, string>;
export type UsePurchaseAction = Mutation<SuccessResponse, string>;

export type UseAddPurchaseItem = Mutation<CreateResponse<PurchaseItem>, AddPurchaseItemPayload>;
export type UseUpdatePurchaseItem = Mutation<SuccessResponse, UpdatePurchaseItemPayload>;
export type UseRemovePurchaseItem = Mutation<SuccessResponse, PurchaseItemRef>;

export type UseRequestPurchaseQuotation = Mutation<
  CreateResponse<RequestedPurchaseQuotation>,
  RequestPurchaseQuotationPayload
>;

export type UseAddPurchaseAllocation = Mutation<CreateResponse<PurchaseAllocation>, AddPurchaseAllocationPayload>;
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
