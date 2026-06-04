import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type { SelectOptionsResponse } from '@vritti/quantum-ui/Select';
import type {
  CatalogChannel,
  CatalogData,
  CatalogTableResponse,
  CreateCatalogData,
  CreateCatalogResponse,
  UpdateCatalogData,
} from '@/schemas/catalogs';

export function getCatalogsTable(): Promise<CatalogTableResponse> {
  return axios
    .get<CatalogTableResponse>('commerce-api/catalogs/table', { showSuccessToast: false })
    .then((r) => r.data);
}

export function getCatalogsSelect(search?: string): Promise<SelectOptionsResponse> {
  return axios
    .get<SelectOptionsResponse>('commerce-api/catalogs/select', { params: { search }, showSuccessToast: false })
    .then((r) => r.data);
}

export function getCatalog(id: string): Promise<CatalogData> {
  return axios.get<CatalogData>(`commerce-api/catalogs/${id}`, { showSuccessToast: false }).then((r) => r.data);
}

export function createCatalog(data: CreateCatalogData): Promise<CreateCatalogResponse> {
  return axios.post<CreateCatalogResponse>('commerce-api/catalogs', data).then((r) => r.data);
}

export function updateCatalog({ id, data }: { id: string; data: UpdateCatalogData }): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/catalogs/${id}`, data).then((r) => r.data);
}

export function deleteCatalog(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/catalogs/${id}`).then((r) => r.data);
}

export function cloneCatalog({ id }: { id: string }): Promise<CreateCatalogResponse> {
  return axios.post<CreateCatalogResponse>(`commerce-api/catalogs/${id}/clone`).then((r) => r.data);
}

export function listCatalogChannels(catalogId: string): Promise<CatalogChannel[]> {
  return axios
    .get<CatalogChannel[]>(`commerce-api/catalogs/${catalogId}/channels`, { showSuccessToast: false })
    .then((r) => r.data);
}
