import axios from '@vritti/quantum-ui/axios';
import type { CurrencyValue } from '@vritti/quantum-ui/currency';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  AddCatalogListingItem,
  CatalogCurrencyData,
  CatalogData,
  CatalogListingData,
  CatalogListingsTableResponse,
  CatalogsTableResponse,
  SetCatalogListingPriceFormData,
} from '@/schemas/catalogs';

const BASE = 'commerce-api/site/catalogs';

export interface CreateCatalogPayload {
  name: string;
  taxInclusive: boolean;
}

export interface UpdateCatalogPayload {
  name?: string;
  taxInclusive?: boolean;
  isActive?: boolean;
}

export interface AddCatalogListingsPayload {
  catalogId: string;
  items: AddCatalogListingItem[];
}

export function getCatalogsTable(): Promise<CatalogsTableResponse> {
  return axios.get<CatalogsTableResponse>(`${BASE}/table`, { showSuccessToast: false }).then((r) => r.data);
}

export function getCatalog(id: string): Promise<CatalogData> {
  return axios.get<CatalogData>(`${BASE}/${id}`, { showSuccessToast: false }).then((r) => r.data);
}

export function createCatalog(data: CreateCatalogPayload): Promise<CreateResponse<CatalogData>> {
  return axios.post<CreateResponse<CatalogData>>(BASE, data).then((r) => r.data);
}

export function updateCatalog({ id, data }: { id: string; data: UpdateCatalogPayload }): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${id}`, data).then((r) => r.data);
}

export function deleteCatalog(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${id}`).then((r) => r.data);
}

export function getCatalogListingsTable(catalogId: string): Promise<CatalogListingsTableResponse> {
  return axios
    .get<CatalogListingsTableResponse>(`${BASE}/${catalogId}/listings/table`, { showSuccessToast: false })
    .then((r) => r.data);
}

export function addCatalogListings({
  catalogId,
  items,
}: AddCatalogListingsPayload): Promise<CreateResponse<CatalogListingData[]>> {
  return axios
    .post<CreateResponse<CatalogListingData[]>>(`${BASE}/${catalogId}/listings/batch`, { items })
    .then((r) => r.data);
}

export function setCatalogListingPrice({
  catalogId,
  listingId,
  price,
}: SetCatalogListingPriceFormData & { catalogId: string; listingId: string }): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`${BASE}/${catalogId}/listings/${listingId}/price`, { price })
    .then((r) => r.data);
}

export function clearCatalogListingPrice({
  catalogId,
  listingId,
  currencyCode,
}: {
  catalogId: string;
  listingId: string;
  currencyCode: string;
}): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`${BASE}/${catalogId}/listings/${listingId}/price`, { params: { currencyCode } })
    .then((r) => r.data);
}

export function getCatalogCurrencies(catalogId: string): Promise<CatalogCurrencyData[]> {
  return axios
    .get<CatalogCurrencyData[]>(`${BASE}/${catalogId}/currencies`, { showSuccessToast: false })
    .then((r) => r.data);
}

export function addCatalogCurrency({
  catalogId,
  currencyCode,
}: {
  catalogId: string;
  currencyCode: string;
}): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${BASE}/${catalogId}/currencies`, { currencyCode }).then((r) => r.data);
}

export function removeCatalogCurrency({
  catalogId,
  currencyCode,
}: {
  catalogId: string;
  currencyCode: string;
}): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${catalogId}/currencies/${currencyCode}`).then((r) => r.data);
}

// The listings table narrowed to one currency — the Prices tab's drill-in
export function getCatalogCurrencyListingsTable({
  catalogId,
  currencyCode,
}: {
  catalogId: string;
  currencyCode: string;
}): Promise<CatalogListingsTableResponse> {
  return axios
    .get<CatalogListingsTableResponse>(`${BASE}/${catalogId}/currencies/${currencyCode}/listings/table`, {
      showSuccessToast: false,
    })
    .then((r) => r.data);
}

export function bulkRemoveCatalogListings({
  catalogId,
  ids,
}: {
  catalogId: string;
  ids: string[];
}): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${catalogId}/listings`, { data: { ids } }).then((r) => r.data);
}

export function bulkSetCatalogListingPrice({
  catalogId,
  ids,
  price,
}: {
  catalogId: string;
  ids: string[];
  price: CurrencyValue;
}): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${catalogId}/listings/prices`, { ids, price }).then((r) => r.data);
}

export function bulkSetCatalogListingAvailability({
  catalogId,
  ids,
  channelIds,
  visible,
}: {
  catalogId: string;
  ids: string[];
  channelIds: string[];
  visible: boolean;
}): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`${BASE}/${catalogId}/listings/availability`, { ids, channelIds, visible })
    .then((r) => r.data);
}

export function deleteCatalogListing({
  catalogId,
  listingId,
}: {
  catalogId: string;
  listingId: string;
}): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${catalogId}/listings/${listingId}`).then((r) => r.data);
}

export function setCatalogListingChannelVisibility({
  catalogId,
  listingId,
  channelId,
  visible,
}: {
  catalogId: string;
  listingId: string;
  channelId: string;
  visible: boolean;
}): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`${BASE}/${catalogId}/listings/${listingId}/channels/${channelId}`, { visible })
    .then((r) => r.data);
}

export interface CatalogOption {
  value: string;
  label: string;
}

export function getCatalogOptions(): Promise<CatalogOption[]> {
  return axios
    .get<{ options: CatalogOption[] }>('commerce-api/select-api/catalogs', {
      params: { valueKey: 'id', labelKey: 'name' },
      showSuccessToast: false,
    })
    .then((r) => r.data.options);
}
