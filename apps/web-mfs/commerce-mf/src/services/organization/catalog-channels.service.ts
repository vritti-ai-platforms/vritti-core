import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  CatalogChannelType,
  ChannelEntryData,
  ChannelItemsTableResponse,
  ChannelPricesTableResponse,
} from '@/schemas/catalog-channels';
import { CatalogChannelTypeValues } from '@/schemas/catalog-channels';

const BASE = 'commerce-api/org/catalog-channels';

export interface UpsertChannelPayload {
  type: CatalogChannelType;
  catalogId: string;
  appId?: string;
  terminalId?: string;
}

// One endpoint per type, because each names a target the others forbid.
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
  return axios.put<CreateResponse<unknown>>(`${BASE}/b2b`, { catalogId, appId }).then((r) => r.data);
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
    .get<ChannelItemsTableResponse>(`${BASE}/${channelId}/listings/table`, { showSuccessToast: false })
    .then((r) => r.data);
}

export function getChannelCurrencies(channelId: string): Promise<string[]> {
  return axios.get<string[]>(`${BASE}/${channelId}/currencies`, { showSuccessToast: false }).then((r) => r.data);
}

export function getChannelPrices({
  channelId,
  currencyCode,
}: {
  channelId: string;
  currencyCode: string;
}): Promise<ChannelPricesTableResponse> {
  return axios
    .get<ChannelPricesTableResponse>(`${BASE}/${channelId}/currencies/${currencyCode}/prices/table`, {
      showSuccessToast: false,
    })
    .then((r) => r.data);
}

export function setChannelItemVisibility({
  channelId,
  listingId,
  availableHere,
  currencyCode,
}: {
  channelId: string;
  listingId: string;
  availableHere: boolean;
  // Omitted withdraws the item outright; a code withdraws it from that currency only
  currencyCode?: string;
}): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`${BASE}/${channelId}/listings/${listingId}`, { availableHere, currencyCode })
    .then((r) => r.data);
}
