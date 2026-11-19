import type { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type {
  DisplayUnitRatios,
  ReplenishmentMethod,
  SiteItemStatus,
  SiteStockLocation,
  StockStatus,
} from '@/db/schema';
import type { InventoryItemDto } from './inventory-item.dto';

export type SiteStockLocationDto = SiteStockLocation;

export type SiteStockTableItemDto = InventoryItemDto & {
  atSite: boolean;
  siteItemStatus: SiteItemStatus | null;
  blockedReason: string | null;
  replenishment: ReplenishmentMethod | null;
  reorderPoint: number | null;
  safetyStock: number | null;
  maxStock: number | null;
  onHand: number;
  stockValue: CurrencyAmountDto;
  stockStatus: StockStatus | null;
  locations: SiteStockLocationDto[];
  displayUnitRatios: DisplayUnitRatios;
};
