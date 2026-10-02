import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { CatalogChannelType, ChannelEntryData, ChannelItemsTableResponse } from '@/schemas/catalog-channels';
import { CatalogChannelTypeValues } from '@/schemas/catalog-channels';

const BASE = 'commerce-api/le/catalog-channels';

export interface UpsertChannelPayload {
  type: CatalogChannelType;
  catalogId: string;
  appId?: string | null;
  terminalId?: string | null;
}

// One endpoint per type, because each names a target the others forbid. Assigning is a PUT: the API
// repoints the row this workspace owns, or stamps a new one, so there is no create/update split here.
export function upsertChannel({
  type,
  catalogId,
  appId,
  terminalId,
}: UpsertChannelPayload): Promise<CreateResponse<unknown>> {
  if (type === CatalogChannelTypeValues.APP) {
    return axios.put<CreateResponse<unknown>>(`${BASE}/app`, { catalogId, appId }).then((r) => r.data);
  }
  if (type === CatalogChannelTypeValues.POS) {
    return axios.put<CreateResponse<unknown>>(`${BASE}/pos`, { catalogId, terminalId }).then((r) => r.data);
  }
  return axios.put<CreateResponse<unknown>>(`${BASE}/b2b`, { catalogId }).then((r) => r.data);
}

export function getCatalogChannels(): Promise<ChannelEntryData[]> {
  return axios.get<ChannelEntryData[]>(BASE, { showSuccessToast: false }).then((r) => r.data);
}

// Everything below keys on channelId and is type-neutral
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
