import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type { SelectOptionsResponse } from '@vritti/quantum-ui/Select';
import type {
  CreatePriceListData,
  CreatePriceListResponse,
  PosTerminalSellableItemData,
  PriceListData,
  PriceListItemData,
  PriceListTableResponse,
  SavePriceListItemsData,
  SaveTerminalPriceListsData,
  TerminalPriceListData,
  UpdatePriceListData,
} from '@/schemas/price-lists';

export function getPriceListsTable(): Promise<PriceListTableResponse> {
  return axios
    .get<PriceListTableResponse>('commerce-api/price-lists/table', { showSuccessToast: false })
    .then((r) => r.data);
}

export function getPriceList(id: string): Promise<PriceListData> {
  return axios.get<PriceListData>(`commerce-api/price-lists/${id}`, { showSuccessToast: false }).then((r) => r.data);
}

export function createPriceList(data: CreatePriceListData): Promise<CreatePriceListResponse> {
  return axios.post<CreatePriceListResponse>('commerce-api/price-lists', data).then((r) => r.data);
}

export function updatePriceList({ id, data }: { id: string; data: UpdatePriceListData }): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/price-lists/${id}`, data).then((r) => r.data);
}

export function deletePriceList(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/price-lists/${id}`).then((r) => r.data);
}

export function getPriceListItems(priceListId: string): Promise<PriceListItemData[]> {
  return axios
    .get<PriceListItemData[]>(`commerce-api/price-lists/${priceListId}/items`, { showSuccessToast: false })
    .then((r) => r.data);
}

export function savePriceListItems({
  priceListId,
  data,
}: {
  priceListId: string;
  data: SavePriceListItemsData;
}): Promise<SuccessResponse> {
  return axios.put<SuccessResponse>(`commerce-api/price-lists/${priceListId}/items`, data).then((r) => r.data);
}

export function getTerminalPriceLists(terminalId: string): Promise<TerminalPriceListData[]> {
  return axios
    .get<TerminalPriceListData[]>(`commerce-api/price-lists/terminals/${terminalId}`, {
      showSuccessToast: false,
    })
    .then((r) => r.data);
}

export function saveTerminalPriceLists({
  terminalId,
  data,
}: {
  terminalId: string;
  data: SaveTerminalPriceListsData;
}): Promise<SuccessResponse> {
  return axios.put<SuccessResponse>(`commerce-api/price-lists/terminals/${terminalId}`, data).then((r) => r.data);
}

export function getTerminalSellableItems(terminalId: string): Promise<PosTerminalSellableItemData[]> {
  return axios
    .get<PosTerminalSellableItemData[]>(`commerce-api/price-lists/terminals/${terminalId}/sellable-items`, {
      showSuccessToast: false,
    })
    .then((r) => r.data);
}

export function searchItemVariantsForPriceList(search?: string): Promise<SelectOptionsResponse> {
  return axios
    .get<SelectOptionsResponse>('commerce-api/price-lists/item-variants/select', {
      params: { search },
      showSuccessToast: false,
    })
    .then((r) => r.data);
}
