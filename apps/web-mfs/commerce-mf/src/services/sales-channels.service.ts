import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type { SelectOptionsResponse } from '@vritti/quantum-ui/Select';
import type { SalesChannelData, SalesChannelKind, SalesChannelsTableResponse } from '@/schemas/sales-channels';

export interface CreateSalesChannelPayload {
  code: string;
  name: string;
  kind: SalesChannelKind;
}

export interface UpdateSalesChannelPayload {
  name?: string;
  isActive?: boolean;
}

export function getSalesChannelsTable(): Promise<SalesChannelsTableResponse> {
  return axios
    .get<SalesChannelsTableResponse>('commerce-api/sales-channels/table', { showSuccessToast: false })
    .then((r) => r.data);
}

export function getSalesChannelsSelect(search?: string): Promise<SelectOptionsResponse> {
  return axios
    .get<SelectOptionsResponse>('commerce-api/sales-channels/select', {
      params: { search },
      showSuccessToast: false,
    })
    .then((r) => r.data);
}

export function getSalesChannel(id: string): Promise<SalesChannelData> {
  return axios
    .get<SalesChannelData>(`commerce-api/sales-channels/${id}`, { showSuccessToast: false })
    .then((r) => r.data);
}

export function createSalesChannel(data: CreateSalesChannelPayload): Promise<SalesChannelData> {
  return axios.post<CreateResponse<SalesChannelData>>('commerce-api/sales-channels', data).then((r) => r.data.data);
}

export function updateSalesChannel({
  id,
  data,
}: {
  id: string;
  data: UpdateSalesChannelPayload;
}): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/sales-channels/${id}`, data).then((r) => r.data);
}

export function deleteSalesChannel(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/sales-channels/${id}`).then((r) => r.data);
}
