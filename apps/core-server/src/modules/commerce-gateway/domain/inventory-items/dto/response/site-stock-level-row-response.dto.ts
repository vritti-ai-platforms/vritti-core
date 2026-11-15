import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import { STOCK_STATUSES, type StockStatus } from '../../../inventory-item-sites/constants/stock-status.constants';
import { SiteStockLocationResponseDto } from '../../../inventory-item-sites/dto/response/site-stock-location-response.dto';

export class SiteStockLevelRowResponseDto {
  @ApiProperty() siteId: string;
  @ApiProperty({ example: 'Mysore Outlet' }) siteName: string;
  @ApiProperty({ example: 'mysore' }) siteCode: string;
  @ApiProperty({ description: 'Whether the item has stock levels set at the site' }) hasStockLevels: boolean;

  @ApiProperty({ type: String, nullable: true, description: "The item's stock levels record; null when not set" })
  stockLevelId: string | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: "Reorder point, in the item's primary unit; null when not set",
  })
  reorderPoint: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: "Safety stock, in the item's primary unit; null when not set",
  })
  safetyStock: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: "Maximum stock level, in the item's primary unit; null when not set",
  })
  maxStockLevel: number | null;

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
    description: 'Where the on-hand quantity sits against the stock levels; null when they are not set',
  })
  stockStatus: StockStatus | null;

  @ApiProperty({ type: [SiteStockLocationResponseDto], description: 'The locations holding the stock, largest first' })
  locations: SiteStockLocationResponseDto[];
}

// The item's stock levels and stock at one of the legal entity's sites, as commerce returns it, with whether it passes
// the table's status filter
export class ItemSiteStockResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() siteId: string;
  @ApiProperty() reorderPoint: number;
  @ApiProperty() safetyStock: number;
  @ApiProperty() maxStockLevel: number;
  @ApiProperty() onHand: number;
  @ApiProperty({ type: () => CurrencyAmountDto }) stockValue: CurrencyAmountDto;
  @ApiProperty({ enum: STOCK_STATUSES }) stockStatus: StockStatus;
  @ApiProperty({ type: [SiteStockLocationResponseDto] }) locations: SiteStockLocationResponseDto[];
  @ApiProperty() matchesFilter: boolean;
}

// The item's stock at the legal entity's sites that have stock levels, and whether the sites without any pass the
// table's status filter
export class ItemStockBySiteResponseDto {
  @ApiProperty({ type: [ItemSiteStockResponseDto] }) rows: ItemSiteStockResponseDto[];
  @ApiProperty() sitesWithoutStockLevelsMatch: boolean;
}

export class SiteStockLevelTableResponseDto extends TableResponseDto<SiteStockLevelRowResponseDto> {
  @ApiProperty({ type: [SiteStockLevelRowResponseDto] })
  declare result: SiteStockLevelRowResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty()
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
