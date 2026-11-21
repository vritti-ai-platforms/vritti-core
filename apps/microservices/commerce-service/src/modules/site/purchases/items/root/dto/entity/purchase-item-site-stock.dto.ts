import type { SiteItemStockDto } from '@domain/inventory-item-sites/dto/entity/item-site-stock.dto';
import type { SiteStockDisplayDto } from '@/modules/site/inventory-items/root/dto/entity/site-stock-display.dto';

export type PurchaseItemSiteStockDto = Omit<SiteItemStockDto, 'displayUnitRatios'> & {
  display: SiteStockDisplayDto;
};
