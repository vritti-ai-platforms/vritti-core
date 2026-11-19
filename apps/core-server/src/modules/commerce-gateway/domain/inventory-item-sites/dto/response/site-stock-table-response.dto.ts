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
} from '../../constants/stock-status.constants';
import { SiteInventoryItemResponseDto } from './inventory-item-response.dto';
import { SiteStockDisplayResponseDto } from './site-stock-display-response.dto';
import { SiteStockLocationResponseDto } from './site-stock-location-response.dto';

export class SiteStockTableRowDto extends SiteInventoryItemResponseDto {
  @ApiProperty({ description: 'Whether this site carries the item' })
  atSite: boolean;

  @ApiPropertyOptional({
    enum: SITE_ITEM_STATUSES,
    nullable: true,
    description: 'Null when the site does not carry it',
  })
  siteItemStatus: SiteItemStatus | null;

  @ApiPropertyOptional({ type: String, nullable: true, description: 'Why this site has blocked purchasing it' })
  blockedReason: string | null;

  @ApiPropertyOptional({
    enum: REPLENISHMENT_METHODS,
    nullable: true,
    description: 'Null when the site does not carry it',
  })
  replenishment: ReplenishmentMethod | null;

  @ApiPropertyOptional({
    description: 'Reorder point at this site, in the primary unit; null when not set',
    nullable: true,
  })
  reorderPoint: number | null;

  @ApiPropertyOptional({
    description: 'Safety stock at this site, in the primary unit; null when not set',
    nullable: true,
  })
  safetyStock: number | null;

  @ApiPropertyOptional({
    description: 'Maximum stock at this site, in the primary unit; null when not set',
    nullable: true,
  })
  maxStock: number | null;

  @ApiProperty({ description: 'Quantity on hand at this site, in the primary unit' })
  onHand: number;

  @ApiProperty({
    description: 'Value of the stock on hand at this site, in the site currency',
    type: () => CurrencyAmountDto,
  })
  stockValue: CurrencyAmountDto;

  @ApiPropertyOptional({
    description: 'Where the on-hand quantity sits; null when the site does not carry the item',
    enum: STOCK_STATUSES,
    nullable: true,
  })
  stockStatus: StockStatus | null;

  @ApiProperty({
    description: 'The locations holding the on-hand quantity, largest first',
    type: [SiteStockLocationResponseDto],
  })
  locations: SiteStockLocationResponseDto[];
  @ApiProperty({
    description: "On hand and the levels in the item's display unit; a level not set is null",
    type: SiteStockDisplayResponseDto,
  })
  display: SiteStockDisplayResponseDto;
}

export class SiteStockTableResponseDto extends TableResponseDto<SiteStockTableRowDto> {
  @ApiProperty({ type: [SiteStockTableRowDto] })
  declare result: SiteStockTableRowDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty()
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
