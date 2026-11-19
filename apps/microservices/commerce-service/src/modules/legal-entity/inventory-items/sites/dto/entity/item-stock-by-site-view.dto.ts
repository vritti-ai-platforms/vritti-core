import type { ItemSiteStockDto } from '@domain/inventory-item-sites/dto/entity/item-site-stock.dto';
import type { SiteStockDisplayDto } from '@/modules/site/inventory-items/root/dto/entity/site-stock-display.dto';

export type ItemSiteStockViewDto = Omit<ItemSiteStockDto, 'displayUnitRatios'> & { display: SiteStockDisplayDto };

export type ItemStockBySiteViewDto = {
  rows: ItemSiteStockViewDto[];
  sitesNotCarryingMatch: boolean;
};
