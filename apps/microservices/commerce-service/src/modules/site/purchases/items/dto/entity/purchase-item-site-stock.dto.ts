import type { SiteItemStockDto } from '@domain/inventory-item-sites/dto/entity/item-site-stock.dto';
import type { DisplayUomQuantityDto } from '@domain/uom-conversions/dto/entity/display-uom-quantity.dto';

export class PurchaseItemSiteStockDisplayDto {
  onHand: DisplayUomQuantityDto | null;
  safetyStock: DisplayUomQuantityDto | null;
  reorderPoint: DisplayUomQuantityDto | null;
  maxStock: DisplayUomQuantityDto | null;
}

export type PurchaseItemSiteStockDto = Omit<SiteItemStockDto, 'displayUnitRatios'> & {
  display: PurchaseItemSiteStockDisplayDto;
};
