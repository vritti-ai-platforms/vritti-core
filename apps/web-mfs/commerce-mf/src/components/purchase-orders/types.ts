import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { GoodsReceiptsTableResponse } from '@/schemas/goods-receipts';
import type { InboundDeliveriesTableResponse } from '@/schemas/inbound-deliveries';
import type {
  AddPurchaseOrderItemPayload,
  ChangePurchaseOrderExchangeRatePayload,
  ChangePurchaseOrderSupplierPayload,
  CreatePurchaseOrderPayload,
  PurchaseOrderData,
  PurchaseOrderDetail,
  PurchaseOrderItemRef,
  PurchaseOrderItemsTableResponse,
  PurchaseOrderProblemsResponse,
  PurchaseOrdersTableResponse,
  SendPurchaseOrderEmailPayload,
  SetPurchaseOrderConversionRatePayload,
  UpdatePurchaseOrderItemPayload,
  UpdatePurchaseOrderNotesPayload,
  UpdatePurchaseOrderStatusPayload,
  UpdatePurchaseOrderTaxDatePayload,
} from '@/schemas/purchase-orders';

export interface PurchaseOrderPermissions {
  view: string;
  add: string;
  edit: string;
  delete: string;
}

type Mutation<TData, TVars> = (
  options?: Omit<UseMutationOptions<TData, AxiosError, TVars>, 'mutationFn'>,
) => UseMutationResult<TData, AxiosError, TVars>;

export type UsePurchaseOrdersTable = () => {
  data: PurchaseOrdersTableResponse | undefined;
  isLoading: boolean;
  isFetching: boolean;
};
export type UsePurchaseOrder = (id: string) => { data: PurchaseOrderDetail };
export type UsePurchaseOrderItemIds = (id: string) => { data: string[] };
export type UsePurchaseOrderItemsTable = (id: string) => {
  data: PurchaseOrderItemsTableResponse | undefined;
  isLoading: boolean;
};
export type UsePurchaseOrderGoodsReceiptsTable = (id: string) => {
  data: GoodsReceiptsTableResponse | undefined;
  isLoading: boolean;
};
export type UsePurchaseOrderInboundDeliveriesTable = (id: string) => {
  data: InboundDeliveriesTableResponse | undefined;
  isLoading: boolean;
};
export type UsePurchaseOrderProblems = (id: string) => { data: PurchaseOrderProblemsResponse | undefined };

export type UseCreatePurchaseOrder = Mutation<CreateResponse<PurchaseOrderData>, CreatePurchaseOrderPayload>;
export type UseAddPurchaseOrderItem = Mutation<CreateResponse<PurchaseOrderData>, AddPurchaseOrderItemPayload>;
export type UseUpdatePurchaseOrderItem = Mutation<SuccessResponse, UpdatePurchaseOrderItemPayload>;
export type UseRemovePurchaseOrderItem = Mutation<SuccessResponse, PurchaseOrderItemRef>;
export type UseUpdatePurchaseOrderNotes = Mutation<SuccessResponse, UpdatePurchaseOrderNotesPayload>;
export type UseChangePurchaseOrderSupplier = Mutation<SuccessResponse, ChangePurchaseOrderSupplierPayload>;
export type UseChangePurchaseOrderExchangeRate = Mutation<SuccessResponse, ChangePurchaseOrderExchangeRatePayload>;
export type UseSetPurchaseOrderConversionRate = Mutation<SuccessResponse, SetPurchaseOrderConversionRatePayload>;
export type UseUpdatePurchaseOrderStatus = Mutation<SuccessResponse, UpdatePurchaseOrderStatusPayload>;
export type UseUpdatePurchaseOrderTaxDate = Mutation<SuccessResponse, UpdatePurchaseOrderTaxDatePayload>;
export type UseSendPurchaseOrderEmail = Mutation<SuccessResponse, SendPurchaseOrderEmailPayload>;
export type UseClosePurchaseOrder = Mutation<SuccessResponse, string>;
export type UseDeletePurchaseOrder = Mutation<SuccessResponse, string>;
export type UseDownloadPurchaseOrderPdf = Mutation<Blob, string>;
