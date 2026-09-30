import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { ChannelItemsTableResponse, ChannelScreenEntryData } from '@/schemas/catalog-channels';

const BASE = 'commerce-api/le/catalog-channels';

export interface CreateAppChannelPayload {
  catalogId: string;
  appId?: string | null;
}

export interface CreatePosChannelPayload {
  catalogId: string;
  terminalId?: string | null;
}

export interface CreateB2bChannelPayload {
  catalogId: string;
}

export function getChannelsScreen(): Promise<ChannelScreenEntryData[]> {
  return axios.get<ChannelScreenEntryData[]>(BASE, { showSuccessToast: false }).then((r) => r.data);
}

// Creation is per type because each names a different target
export function createAppChannel(data: CreateAppChannelPayload): Promise<CreateResponse<unknown>> {
  return axios.post<CreateResponse<unknown>>(`${BASE}/app`, data).then((r) => r.data);
}

export function createPosChannel(data: CreatePosChannelPayload): Promise<CreateResponse<unknown>> {
  return axios.post<CreateResponse<unknown>>(`${BASE}/pos`, data).then((r) => r.data);
}

export function createB2bChannel(data: CreateB2bChannelPayload): Promise<CreateResponse<unknown>> {
  return axios.post<CreateResponse<unknown>>(`${BASE}/b2b`, data).then((r) => r.data);
}

// Everything below keys on channelId and is type-neutral
export function updateChannel({
  channelId,
  catalogId,
}: {
  channelId: string;
  catalogId: string;
}): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${channelId}`, { catalogId }).then((r) => r.data);
}

export function deleteChannel(channelId: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${channelId}`).then((r) => r.data);
}

export function getChannelItems(channelId: string): Promise<ChannelItemsTableResponse> {
  return axios
    .get<ChannelItemsTableResponse>(`${BASE}/${channelId}/items/table`, { showSuccessToast: false })
    .then((r) => r.data);
}

export function setChannelItemVisibility({
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
