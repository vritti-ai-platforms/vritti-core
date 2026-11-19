import type { DisplayUomQuantityDto } from '@domain/uom-conversions/dto/entity/display-uom-quantity.dto';

export const SITE_STOCK_QUANTITY_KEYS = ['onHand', 'safetyStock', 'reorderPoint', 'maxStock'] as const;

export type SiteStockQuantityKey = (typeof SITE_STOCK_QUANTITY_KEYS)[number];

export class SiteStockDisplayDto {
  onHand: DisplayUomQuantityDto | null;
  safetyStock: DisplayUomQuantityDto | null;
  reorderPoint: DisplayUomQuantityDto | null;
  maxStock: DisplayUomQuantityDto | null;
}
