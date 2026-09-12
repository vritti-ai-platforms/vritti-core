import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  CatalogChannelData,
  CatalogChannelsTableResponse,
  CatalogChannelType,
  CreateCatalogChannelFormData,
  ResolvedCatalogData,
} from '@/schemas/catalog-channels';

const BASE = 'commerce-api/org/catalog-channels';

export function getCatalogChannelsTable(): Promise<CatalogChannelsTableResponse> {
  return axios.get<CatalogChannelsTableResponse>(`${BASE}/table`, { showSuccessToast: false }).then((r) => r.data);
}

export function createCatalogChannel(data: CreateCatalogChannelFormData): Promise<CreateResponse<CatalogChannelData>> {
  return axios.post<CreateResponse<CatalogChannelData>>(BASE, data).then((r) => r.data);
}

export function repointCatalogChannel({ id, catalogId }: { id: string; catalogId: string }): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${id}`, { catalogId }).then((r) => r.data);
}

export function deleteCatalogChannel(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${id}`).then((r) => r.data);
}

export interface ResolveChannelParams {
  type: CatalogChannelType;
  legalEntityId?: string;
  siteId?: string;
  appId?: string;
  terminalId?: string;
}

export function resolveCatalogChannel(params: ResolveChannelParams): Promise<ResolvedCatalogData> {
  return axios
    .get<ResolvedCatalogData>(`${BASE}/resolve`, { params, showSuccessToast: false, showErrorToast: false })
    .then((r) => r.data);
}

export function getCatalogChannelsForCatalog(catalogId: string): Promise<CatalogChannelData[]> {
  return axios
    .get<CatalogChannelData[]>(`commerce-api/org/catalogs/${catalogId}/channels`, { showSuccessToast: false })
    .then((r) => r.data);
}
