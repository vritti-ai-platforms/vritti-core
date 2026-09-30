import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { ChannelItemsTableResponse, ChannelScreenEntryData } from '@/schemas/catalog-channels';

export interface CatalogChannelPermissions {
  featureCode: string;
  view: string;
  edit: string;
}

type Mutation<TVars, TData = SuccessResponse> = (options?: {
  onSuccess?: () => void;
}) => UseMutationResult<TData, AxiosError, TVars>;

export type UseChannelsScreen = () => UseQueryResult<ChannelScreenEntryData[], AxiosError>;
export type UseChannelItems = (channelId: string) => UseQueryResult<ChannelItemsTableResponse, AxiosError>;

// Creation is per type because each names a different target the others forbid
export type UseCreateAppChannel = Mutation<{ catalogId: string; appId?: string | null }, CreateResponse<unknown>>;
export type UseCreatePosChannel = Mutation<{ catalogId: string; terminalId?: string | null }, CreateResponse<unknown>>;
export type UseCreateB2bChannel = Mutation<{ catalogId: string }, CreateResponse<unknown>>;

// Everything after creation keys on channelId and is type-neutral
export type UseUpdateChannel = Mutation<{ channelId: string; catalogId: string }>;
export type UseDeleteChannel = Mutation<string>;
export type UseSetChannelItemVisibility = Mutation<{ channelId: string; listingId: string; sellsHere: boolean }>;
