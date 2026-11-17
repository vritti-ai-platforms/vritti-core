import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  REPLENISHMENT_METHODS,
  type ReplenishmentMethod,
  SITE_ITEM_STATUSES,
  type SiteItemStatus,
} from '../../constants/stock-status.constants';

export class InventoryItemSiteResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() siteId: string;

  @ApiProperty({ description: 'ACTIVE, or BLOCKED when the site has stopped buying it', enum: SITE_ITEM_STATUSES })
  status: SiteItemStatus;

  @ApiPropertyOptional({ description: 'Why purchasing is blocked', type: String, nullable: true })
  blockedReason: string | null;

  @ApiPropertyOptional({ description: 'When purchasing was blocked', type: String, nullable: true })
  blockedAt: string | null;

  @ApiProperty({ description: 'How the site restocks the item', enum: REPLENISHMENT_METHODS })
  replenishment: ReplenishmentMethod;

  @ApiPropertyOptional({ description: "Safety stock, in the item's primary unit", type: Number, nullable: true })
  safetyStock: number | null;

  @ApiPropertyOptional({ description: "Reorder point, in the item's primary unit", type: Number, nullable: true })
  reorderPoint: number | null;

  @ApiPropertyOptional({ description: "Maximum stock, in the item's primary unit", type: Number, nullable: true })
  maxStock: number | null;

  @ApiProperty({
    description: "Buying the item here needs the supplier's item set up here, whatever the site's own rule says",
  })
  supplierItemsRequired: boolean;
}
