import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { InventoryItemLotsTableResponse } from '@/schemas/inventory-item-lots';
import type { InventoryItemQuantsTableResponse } from '@/schemas/inventory-item-quants';
import type {
  EnableInventoryItemFormData,
  InventoryItemData,
  InventoryItemLedgerTableResponse,
  InventoryItemStockData,
  SiteInventoryItemsTableResponse,
  UpdateReorderFormData,
} from '@/schemas/inventory-items';
import type {
  InventoryItemPriceGraph,
  InventoryItemSuppliersTableResponse,
  ItemSupplierPricesTableResponse,
  PriceGraphSelection,
} from '@/schemas/suppliers';
import { priceGraphState } from '@/utils/supplierPrice';

const BASE = 'commerce-api/site/inventory-items';

export function getInventoryItemsTable(): Promise<SiteInventoryItemsTableResponse> {
  return axios.get<SiteInventoryItemsTableResponse>(`${BASE}/table`).then((r) => r.data);
}

export function enableInventoryItem(data: EnableInventoryItemFormData): Promise<CreateResponse<{ id: string }>> {
  return axios.post<CreateResponse<{ id: string }>>(`${BASE}/enable`, data).then((r) => r.data);
}

export function updateInventoryItemReorder(
  data: UpdateReorderFormData & { inventoryItemId: string },
): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/reorder`, data).then((r) => r.data);
}

export function getInventoryItem(id: string): Promise<InventoryItemData> {
  return axios.get<InventoryItemData>(`${BASE}/${id}`).then((r) => r.data);
}

export function getInventoryItemQuantsTable(id: string): Promise<InventoryItemQuantsTableResponse> {
  return axios.get<InventoryItemQuantsTableResponse>(`${BASE}/${id}/quants/table`).then((r) => r.data);
}

export function getInventoryItemLotsTable(id: string): Promise<InventoryItemLotsTableResponse> {
  return axios.get<InventoryItemLotsTableResponse>(`${BASE}/${id}/lots/table`).then((r) => r.data);
}

export function getInventoryItemStocks(id: string): Promise<InventoryItemStockData[]> {
  return axios.get<InventoryItemStockData[]>(`${BASE}/${id}/stocks`).then((r) => r.data);
}

export function getInventoryItemSuppliersTable(id: string): Promise<InventoryItemSuppliersTableResponse> {
  return axios
    .get<InventoryItemSuppliersTableResponse>(`${BASE}/${id}/suppliers/table`, { showSuccessToast: false })
    .then((r) => r.data);
}

export function getInventoryItemLedgerTable(id: string): Promise<InventoryItemLedgerTableResponse> {
  return axios.get<InventoryItemLedgerTableResponse>(`${BASE}/${id}/ledger/table`).then((r) => r.data);
}

export function getInventoryItemPricesTable(id: string): Promise<ItemSupplierPricesTableResponse> {
  return axios.get<ItemSupplierPricesTableResponse>(`${BASE}/${id}/prices/table`).then((r) => r.data);
}

export function getInventoryItemPriceGraph(id: string): Promise<InventoryItemPriceGraph> {
  return axios.get<InventoryItemPriceGraph>(`${BASE}/${id}/prices/graph`).then((r) => r.data);
}

// Saves what the price graph shows to its live table state, which the graph endpoint reads back
export function saveInventoryItemPriceGraph(id: string, selection: PriceGraphSelection): Promise<void> {
  return axios
    .post(
      'table-states',
      {
        tableSlug: `commerce-site-inventory-item-${id}-price-graph`,
        state: priceGraphState(selection),
        activeViewId: null,
      },
      { showSuccessToast: false },
    )
    .then(() => undefined);
}
