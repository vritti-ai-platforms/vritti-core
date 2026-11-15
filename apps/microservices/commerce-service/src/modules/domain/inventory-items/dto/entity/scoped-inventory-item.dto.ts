import type { CurrencyAmountDto } from '@vritti/api-sdk/money';
import { type SiteStockLocation, type StockStatus } from '@/db/schema';
import type { InventoryItemDto } from './inventory-item.dto';

export type SiteStockLocationDto = SiteStockLocation;

export type SiteStockTableItemDto = InventoryItemDto & {
  hasStockLevels: boolean;
  reorderPoint: number | null;
  safetyStock: number | null;
  maxStockLevel: number | null;
  onHand: number;
  stockValue: CurrencyAmountDto;
  stockStatus: StockStatus | null;
  locations: SiteStockLocationDto[];
};
