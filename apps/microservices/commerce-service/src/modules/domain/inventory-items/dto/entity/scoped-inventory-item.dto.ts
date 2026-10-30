import type { InventoryItemDto } from './inventory-item.dto';

export type SiteInventoryItemDto = InventoryItemDto & {
  isEnabled: boolean;
  isStocked: boolean | null;
  reorderPoint: number | null;
  stockedQuantity: string;
};

export type GroupInventoryItemDto = InventoryItemDto & {
  enabledSiteCount: number;
};
