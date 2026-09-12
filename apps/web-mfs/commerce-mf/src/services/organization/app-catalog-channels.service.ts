import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  AddAppChannelFormData,
  CatalogChannelData,
  CatalogChannelsTableResponse,
  ChannelItemsTableResponse,
} from '@/schemas/catalog-channels';

const BASE = 'commerce-api/org/catalog-channels/app';

export function getAppChannelsTable(): Promise<CatalogChannelsTableResponse> {
  return axios.get<CatalogChannelsTableResponse>(`${BASE}/table`, { showSuccessToast: false }).then((r) => r.data);
}

export function createAppChannel(data: AddAppChannelFormData): Promise<CreateResponse<CatalogChannelData>> {
  return axios.post<CreateResponse<CatalogChannelData>>(BASE, data).then((r) => r.data);
}

export function updateAppChannel({
  channelId,
  catalogId,
}: {
  channelId: string;
  catalogId: string;
}): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${channelId}`, { catalogId }).then((r) => r.data);
}

export function deleteAppChannel(channelId: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${channelId}`).then((r) => r.data);
}

export function getAppChannelItems(channelId: string): Promise<ChannelItemsTableResponse> {
  return axios
    .get<ChannelItemsTableResponse>(`${BASE}/${channelId}/items/table`, { showSuccessToast: false })
    .then((r) => r.data);
}

export function setAppChannelItemVisibility({
  channelId,
  listingId,
  sellsHere,
}: {
  channelId: string;
  listingId: string;
  sellsHere: boolean;
}): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${channelId}/items/${listingId}`, { sellsHere }).then((r) => r.data);
}
