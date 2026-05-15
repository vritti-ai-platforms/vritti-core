import axios from '@vritti/quantum-ui/axios';
import type { InventoryItemQuantData } from '@/schemas/inventory-item-quants';

export function getInventoryItemQuant(id: string): Promise<InventoryItemQuantData> {
  return axios.get<InventoryItemQuantData>(`commerce-api/inventory-item-quants/${id}`).then((r) => r.data);
}
