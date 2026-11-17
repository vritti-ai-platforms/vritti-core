import type { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { ItemSiteStockRow, SiteItemStockRow } from '../../repositories/inventory-item-sites.repository';

export type ItemSiteStockDto = Omit<ItemSiteStockRow, 'stockValue'> & { stockValue: CurrencyAmountDto };

export type SiteItemStockDto = Omit<SiteItemStockRow, 'stockValue'> & { stockValue: CurrencyAmountDto };

export type ItemStockBySiteDto = {
  rows: ItemSiteStockDto[];
  sitesNotCarryingMatch: boolean;
};
