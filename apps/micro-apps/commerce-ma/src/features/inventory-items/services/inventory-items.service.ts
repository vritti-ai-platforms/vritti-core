import { axios } from '@vritti/quantum-ui-native/utils';
import type { CursorPage, FilterCondition, InventoryItem, SearchState, SortCondition } from '../../../types/list';

export interface ListInventoryItemsBody {
  filters: FilterCondition[];
  search: SearchState | null;
  sort: SortCondition[];
  limit: number;
  cursor?: string;
}

export function listInventoryItems(body: ListInventoryItemsBody): Promise<CursorPage<InventoryItem>> {
  return axios
    .post<CursorPage<InventoryItem>>('commerce-api/inventory-items/feed', body, { showSuccessToast: false })
    .then((r) => r.data);
}
