import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type {
  AddGoodsReceiptLineItemPayload,
  AddGoodsReceiptLinePayload,
  AddGoodsReceiptLotPayload,
  AddGoodsReceiptPurchaseOrderPayload,
  CreateGoodsReceiptFromDeliveryPayload,
  CreateGoodsReceiptFromPurchaseOrdersPayload,
  GoodsReceiptData,
  GoodsReceiptItemData,
  GoodsReceiptItemQuantsData,
  GoodsReceiptItemsCostData,
  GoodsReceiptLineData,
  GoodsReceiptLineItemData,
  GoodsReceiptLineItemsTableResponse,
  GoodsReceiptLinesTableResponse,
  GoodsReceiptLotData,
  GoodsReceiptsTableResponse,
  GoodsReceiptTreeNode,
  UpdateGoodsReceiptItemPayload,
  UpdateGoodsReceiptLinePayload,
  UpdateGoodsReceiptLotPayload,
  UpdateGoodsReceiptPayload,
} from '@/schemas/goods-receipts';

export interface GoodsReceiptPermissions {
  view: string;
  add: string;
  edit: string;
  delete: string;
  publish: string;
}

type MutationOptions<TData, TVars> = Omit<UseMutationOptions<TData, AxiosError, TVars>, 'mutationFn'>;
type MutationResult<TData, TVars> = UseMutationResult<TData, AxiosError, TVars>;
type Query<TData> = { data: TData | undefined; isLoading: boolean };

export type UseGoodsReceiptsTable = () => Query<GoodsReceiptsTableResponse> & { isFetching: boolean };
export type UseGoodsReceipt = (id: string) => { data: GoodsReceiptData };
export type UseGoodsReceiptTree = (id: string) => Query<GoodsReceiptTreeNode[]>;
export type UseGoodsReceiptItemsCost = (id: string) => Query<GoodsReceiptItemsCostData>;
export type UseGoodsReceiptItemQuants = (id: string, itemId: string) => Query<GoodsReceiptItemQuantsData>;
export type UseGoodsReceiptItem = (id: string, itemId: string) => Query<GoodsReceiptItemData>;
export type UseGoodsReceiptLots = (id: string, itemId: string) => Query<GoodsReceiptLotData[]>;
export type UseGoodsReceiptLinesTable = (id: string, itemId: string | null) => Query<GoodsReceiptLinesTableResponse>;
export type UseGoodsReceiptLinesByLotTable = (
  id: string,
  itemId: string,
  lotId: string | null,
) => Query<GoodsReceiptLinesTableResponse>;
export type UseGoodsReceiptLine = (id: string, itemId: string, lineId: string) => Query<GoodsReceiptLineData>;
export type UseGoodsReceiptLineItemsTable = (
  id: string,
  itemId: string,
  lineId: string,
) => Query<GoodsReceiptLineItemsTableResponse>;

export type UseCreateGoodsReceiptFromDelivery = (
  options?: MutationOptions<CreateResponse<GoodsReceiptData>, CreateGoodsReceiptFromDeliveryPayload>,
) => MutationResult<CreateResponse<GoodsReceiptData>, CreateGoodsReceiptFromDeliveryPayload>;
export type UseCreateGoodsReceiptFromPurchaseOrders = (
  options?: MutationOptions<CreateResponse<GoodsReceiptData>, CreateGoodsReceiptFromPurchaseOrdersPayload>,
) => MutationResult<CreateResponse<GoodsReceiptData>, CreateGoodsReceiptFromPurchaseOrdersPayload>;
export type UsePublishGoodsReceipt = (
  id: string,
  options?: MutationOptions<GoodsReceiptData, void>,
) => MutationResult<GoodsReceiptData, void>;
export type UseDeleteGoodsReceipt = (
  options?: MutationOptions<SuccessResponse, string>,
) => MutationResult<SuccessResponse, string>;
export type UseAddGoodsReceiptPurchaseOrder = (
  goodsReceiptId: string,
  options?: MutationOptions<SuccessResponse, AddGoodsReceiptPurchaseOrderPayload>,
) => MutationResult<SuccessResponse, AddGoodsReceiptPurchaseOrderPayload>;
export type UseUpdateGoodsReceipt = (
  goodsReceiptId: string,
  options?: MutationOptions<SuccessResponse, UpdateGoodsReceiptPayload>,
) => MutationResult<SuccessResponse, UpdateGoodsReceiptPayload>;
export type UseUpdateGoodsReceiptItem = (
  goodsReceiptId: string,
  itemId: string,
  options?: MutationOptions<SuccessResponse, UpdateGoodsReceiptItemPayload>,
) => MutationResult<SuccessResponse, UpdateGoodsReceiptItemPayload>;
export type UseRemoveGoodsReceiptItem = (
  goodsReceiptId: string,
  options?: MutationOptions<SuccessResponse, string>,
) => MutationResult<SuccessResponse, string>;
export type UseAddGoodsReceiptLot = (
  goodsReceiptId: string,
  itemId: string,
  options?: MutationOptions<CreateResponse<GoodsReceiptLotData>, AddGoodsReceiptLotPayload>,
) => MutationResult<CreateResponse<GoodsReceiptLotData>, AddGoodsReceiptLotPayload>;
export type UseUpdateGoodsReceiptLot = (
  goodsReceiptId: string,
  itemId: string,
  lotId: string,
  options?: MutationOptions<SuccessResponse, UpdateGoodsReceiptLotPayload>,
) => MutationResult<SuccessResponse, UpdateGoodsReceiptLotPayload>;
export type UseRemoveGoodsReceiptLot = (
  goodsReceiptId: string,
  itemId: string,
  options?: MutationOptions<SuccessResponse, string>,
) => MutationResult<SuccessResponse, string>;
export type UseAddGoodsReceiptLine = (
  goodsReceiptId: string,
  itemId: string,
  options?: MutationOptions<CreateResponse<GoodsReceiptLineData>, AddGoodsReceiptLinePayload>,
) => MutationResult<CreateResponse<GoodsReceiptLineData>, AddGoodsReceiptLinePayload>;
export type UseUpdateGoodsReceiptLine = (
  goodsReceiptId: string,
  itemId: string,
  lineId: string,
  options?: MutationOptions<SuccessResponse, UpdateGoodsReceiptLinePayload>,
) => MutationResult<SuccessResponse, UpdateGoodsReceiptLinePayload>;
export type UseRemoveGoodsReceiptLine = (
  goodsReceiptId: string,
  itemId: string,
  options?: MutationOptions<SuccessResponse, string>,
) => MutationResult<SuccessResponse, string>;
export type UseAddGoodsReceiptLineItem = (
  goodsReceiptId: string,
  itemId: string,
  lineId: string,
  options?: MutationOptions<CreateResponse<GoodsReceiptLineItemData>, AddGoodsReceiptLineItemPayload>,
) => MutationResult<CreateResponse<GoodsReceiptLineItemData>, AddGoodsReceiptLineItemPayload>;
export type UseRemoveGoodsReceiptLineItem = (
  goodsReceiptId: string,
  itemId: string,
  lineId: string,
  options?: MutationOptions<SuccessResponse, string>,
) => MutationResult<SuccessResponse, string>;

export type TreeSelection =
  | { kind: 'item'; itemId: string }
  | { kind: 'lot'; itemId: string; lotId: string }
  | { kind: 'line'; itemId: string; lotId: string | null; lineId: string };
