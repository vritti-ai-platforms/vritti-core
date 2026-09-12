import axios from '@vritti/quantum-ui/axios';
import type { CurrencyValue } from '@vritti/quantum-ui/currency';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  AddCatalogListingFormData,
  CatalogData,
  CatalogListingData,
  CatalogListingsTableResponse,
  CatalogsTableResponse,
  SetCatalogListingPriceFormData,
} from '@/schemas/catalogs';

const BASE = 'commerce-api/org/catalogs';

export interface CreateCatalogPayload {
  name: string;
  taxInclusive: boolean;
}

export interface UpdateCatalogPayload {
  name?: string;
  taxInclusive?: boolean;
  isActive?: boolean;
}

export type AddCatalogListingPayload = AddCatalogListingFormData & { catalogId: string };

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

export function addCatalogListing({
  catalogId,
  ...data
}: AddCatalogListingPayload): Promise<CreateResponse<CatalogListingData>> {
  return axios.post<CreateResponse<CatalogListingData>>(`${BASE}/${catalogId}/listings`, data).then((r) => r.data);
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

export function setCatalogListingStatus({
  catalogId,
  listingId,
  isActive,
}: {
  catalogId: string;
  listingId: string;
  isActive: boolean;
}): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`${BASE}/${catalogId}/listings/${listingId}/status`, { isActive })
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

export interface CatalogListingMrpOption {
  id: string;
  mrp: CurrencyValue;
  uomSymbol: string | null;
  isCurrent: boolean;
}

export function getCatalogListingMrpOptions(offeringVariantId: string): Promise<CatalogListingMrpOption[]> {
  return axios
    .get<CatalogListingMrpOption[]>(`${BASE}/listings/mrp-options`, {
      params: { offeringVariantId },
      showSuccessToast: false,
    })
    .then((r) => r.data);
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
