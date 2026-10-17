import type { UseMutationResult, UseQueryResult, UseSuspenseQueryResult } from '@tanstack/react-query';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type {
  CatalogChannelType,
  ChannelEntryData,
  ChannelItemsTableResponse,
  ChannelPricesTableResponse,
} from '@/schemas/catalog-channels';

export interface CatalogChannelPermissions {
  featureCode: string;
  view: string;
  listings: string;
  prices: string;
  edit: string;
  visibility: string;
  delete: string;
}

type Mutation<TVars, TData = SuccessResponse> = (options?: {
  onSuccess?: () => void;
}) => UseMutationResult<TData, AxiosError, TVars>;

export type UseCatalogChannels = () => UseSuspenseQueryResult<ChannelEntryData[], AxiosError>;
export type UseChannelItems = (channelId: string) => UseQueryResult<ChannelItemsTableResponse, AxiosError>;
export type UseChannelCurrencies = (channelId: string) => UseQueryResult<string[], AxiosError>;
export type UseChannelPrices = (
  channelId: string,
  currencyCode: string,
) => UseQueryResult<ChannelPricesTableResponse, AxiosError>;

// One entry point; the service dispatches to the per-type endpoint. Assigning is an upsert, so a
// caller never has to know whether this workspace already owns a row for the slot.
export type UseUpsertChannel = Mutation<
  { type: CatalogChannelType; catalogId: string; appId?: string; terminalId?: string },
  CreateResponse<unknown>
>;

// Everything after assigning keys on channelId and is type-neutral
export type UseDeleteChannel = Mutation<string>;
// A currency excludes the item from that currency only; omitting it excludes the item outright
export type UseSetChannelItemVisibility = Mutation<{
  channelId: string;
  listingId: string;
  availableHere: boolean;
  currencyCode?: string;
}>;
