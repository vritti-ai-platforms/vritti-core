import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type {
  AddAppChannelFormData,
  CatalogChannelData,
  CatalogChannelsTableResponse,
  ChannelItemsTableResponse,
  ChannelOverviewData,
} from '@/schemas/catalog-channels';

export type UseCreateAppChannel = (options?: {
  onSuccess?: () => void;
}) => UseMutationResult<CreateResponse<CatalogChannelData>, AxiosError, AddAppChannelFormData>;

export type UseUpdateAppChannel = (options?: {
  onSuccess?: () => void;
}) => UseMutationResult<SuccessResponse, AxiosError, { channelId: string; catalogId: string }>;

// One page serves all three workspaces; each supplies its own scoped hooks
export interface CatalogChannelsBinding {
  scopeNoun: string;
  scopeSegment: string;
  description: string;
  useOverview: () => UseQueryResult<ChannelOverviewData[], AxiosError>;
  useAppChannels: () => UseQueryResult<CatalogChannelsTableResponse, AxiosError>;
  useAppItems: (channelId: string) => UseQueryResult<ChannelItemsTableResponse, AxiosError>;
  useSetItemVisibility: () => UseMutationResult<
    SuccessResponse,
    AxiosError,
    { channelId: string; listingId: string; sellsHere: boolean }
  >;
  useCreateAppChannel: UseCreateAppChannel;
  useUpdateAppChannel: UseUpdateAppChannel;
  useDeleteAppChannel: (options?: { onSuccess?: () => void }) => UseMutationResult<SuccessResponse, AxiosError, string>;
  appChannelsKey: readonly unknown[];
  appItemsKey: (channelId: string) => readonly unknown[];
}
