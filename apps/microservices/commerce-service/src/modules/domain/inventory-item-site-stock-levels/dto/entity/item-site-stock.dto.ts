import type { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { ItemSiteStockRow } from '../../repositories/inventory-item-site-stock-levels.repository';

export type ItemSiteStockDto = Omit<ItemSiteStockRow, 'stockValue'> & { stockValue: CurrencyAmountDto };

export type ItemStockBySiteDto = {
  rows: ItemSiteStockDto[];
  sitesWithoutStockLevelsMatch: boolean;
};
