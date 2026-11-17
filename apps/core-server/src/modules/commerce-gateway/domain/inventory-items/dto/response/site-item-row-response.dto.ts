import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import {
  REPLENISHMENT_METHODS,
  type ReplenishmentMethod,
  SITE_ITEM_STATUSES,
  type SiteItemStatus,
  STOCK_STATUSES,
  type StockStatus,
} from '../../../inventory-item-sites/constants/stock-status.constants';
import { SiteStockLocationResponseDto } from '../../../inventory-item-sites/dto/response/site-stock-location-response.dto';

export class SiteItemRowResponseDto {
  @ApiProperty() siteId: string;
  @ApiProperty({ example: 'Mysore Outlet' }) siteName: string;
  @ApiProperty({ example: 'mysore' }) siteCode: string;
  @ApiProperty({ description: 'Whether the site carries the item' }) atSite: boolean;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'The site item record; null when the site does not carry it',
  })
  siteItemId: string | null;

  @ApiPropertyOptional({
    enum: SITE_ITEM_STATUSES,
    nullable: true,
    description: 'Null when the site does not carry it',
  })
  siteItemStatus: SiteItemStatus | null;

  @ApiPropertyOptional({ type: String, nullable: true, description: 'Why the site has blocked purchasing it' })
  blockedReason: string | null;

  @ApiPropertyOptional({
    enum: REPLENISHMENT_METHODS,
    nullable: true,
    description: 'Null when the site does not carry it',
  })
  replenishment: ReplenishmentMethod | null;

  @ApiProperty({ type: Number, nullable: true, description: "Reorder point, in the item's primary unit" })
  reorderPoint: number | null;

  @ApiProperty({ type: Number, nullable: true, description: "Safety stock, in the item's primary unit" })
  safetyStock: number | null;

  @ApiProperty({ type: Number, nullable: true, description: "Maximum stock, in the item's primary unit" })
  maxStock: number | null;

  @ApiProperty({ description: "Buying the item here needs the supplier's item set up here; false when not carried" })
  supplierItemsRequired: boolean;

  @ApiProperty({ description: "On-hand quantity at the site, in the item's primary unit; 0 when none" })
  onHand: number;

  @ApiProperty({
    description: "Value of the stock on hand, in the legal entity's currency",
    type: () => CurrencyAmountDto,
  })
  stockValue: CurrencyAmountDto;

  @ApiProperty({
    nullable: true,
    enum: STOCK_STATUSES,
    description: 'Where the on-hand quantity sits; null when the site does not carry the item',
  })
  stockStatus: StockStatus | null;

  @ApiProperty({ type: [SiteStockLocationResponseDto], description: 'The locations holding the stock, largest first' })
  locations: SiteStockLocationResponseDto[];
}

export class ItemSiteStockResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() siteId: string;
  @ApiProperty({ enum: SITE_ITEM_STATUSES }) status: SiteItemStatus;
  @ApiPropertyOptional({ type: String, nullable: true }) blockedReason: string | null;
  @ApiProperty({ enum: REPLENISHMENT_METHODS }) replenishment: ReplenishmentMethod;
  @ApiProperty({ type: Number, nullable: true }) reorderPoint: number | null;
  @ApiProperty({ type: Number, nullable: true }) safetyStock: number | null;
  @ApiProperty({ type: Number, nullable: true }) maxStock: number | null;
  @ApiProperty({ description: "Buying the item here needs the supplier's item set up here" })
  supplierItemsRequired: boolean;
  @ApiProperty() onHand: number;
  @ApiProperty({ type: () => CurrencyAmountDto }) stockValue: CurrencyAmountDto;
  @ApiProperty({ enum: STOCK_STATUSES }) stockStatus: StockStatus;
  @ApiProperty({ type: [SiteStockLocationResponseDto] }) locations: SiteStockLocationResponseDto[];
  @ApiProperty() matchesFilter: boolean;
}

export class ItemStockBySiteResponseDto {
  @ApiProperty({ type: [ItemSiteStockResponseDto] }) rows: ItemSiteStockResponseDto[];
  @ApiProperty() sitesNotCarryingMatch: boolean;
}

export class SiteItemTableResponseDto extends TableResponseDto<SiteItemRowResponseDto> {
  @ApiProperty({ type: [SiteItemRowResponseDto] })
  declare result: SiteItemRowResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty()
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
