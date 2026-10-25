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
  setAvailability: string;
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

export type UseUpsertChannel = Mutation<
  { type: CatalogChannelType; catalogId: string; appId?: string; terminalId?: string },
  CreateResponse<unknown>
>;

export type UseDeleteChannel = Mutation<string>;

export type UseSetChannelItemVisibility = Mutation<{
  channelId: string;
  listingId: string;
  availableHere: boolean;
  currencyCode?: string;
}>;
