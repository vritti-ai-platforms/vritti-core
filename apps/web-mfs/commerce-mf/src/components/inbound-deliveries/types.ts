import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { GoodsReceiptData } from '@/schemas/goods-receipts';
import type {
  AddInboundDeliveryLinesPayload,
  CreateInboundDeliveryPayload,
  InboundDeliveriesTableResponse,
  InboundDeliveryData,
  InboundDeliveryLineRef,
  InboundDeliveryLinesTableResponse,
  ReceiveInboundDeliveryPayload,
  UpdateInboundDeliveryLinePayload,
  UpdateInboundDeliveryPayload,
  UpdateInboundDeliveryStatusPayload,
} from '@/schemas/inbound-deliveries';

export interface InboundDeliveryWritePermissions {
  add: string;
  edit: string;
  delete: string;
}

type Mutation<TData, TVars> = (
  options?: Omit<UseMutationOptions<TData, AxiosError, TVars>, 'mutationFn'>,
) => UseMutationResult<TData, AxiosError, TVars>;

export type UseInboundDeliveriesTable = () => {
  data: InboundDeliveriesTableResponse | undefined;
  isLoading: boolean;
  isFetching: boolean;
};
export type UseInboundDelivery = (id: string) => { data: InboundDeliveryData };
export type UseInboundDeliveryLinesTable = (id: string) => {
  data: InboundDeliveryLinesTableResponse | undefined;
  isLoading: boolean;
};

export type UseCreateInboundDelivery = Mutation<CreateResponse<InboundDeliveryData>, CreateInboundDeliveryPayload>;
export type UseUpdateInboundDelivery = Mutation<SuccessResponse, UpdateInboundDeliveryPayload>;
export type UseUpdateInboundDeliveryStatus = Mutation<SuccessResponse, UpdateInboundDeliveryStatusPayload>;
export type UseDeleteInboundDelivery = Mutation<SuccessResponse, string>;
export type UseAddInboundDeliveryLines = Mutation<SuccessResponse, AddInboundDeliveryLinesPayload>;
export type UseUpdateInboundDeliveryLine = Mutation<SuccessResponse, UpdateInboundDeliveryLinePayload>;
export type UseRemoveInboundDeliveryLine = Mutation<SuccessResponse, InboundDeliveryLineRef>;
export type UseReceiveInboundDelivery = Mutation<CreateResponse<GoodsReceiptData>, ReceiveInboundDeliveryPayload>;
