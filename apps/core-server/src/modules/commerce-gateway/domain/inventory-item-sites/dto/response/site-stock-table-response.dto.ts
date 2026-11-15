import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import { STOCK_STATUSES, type StockStatus } from '../../constants/stock-status.constants';
import { SiteInventoryItemResponseDto } from './inventory-item-response.dto';
import { SiteStockLocationResponseDto } from './site-stock-location-response.dto';

export class SiteStockTableRowDto extends SiteInventoryItemResponseDto {
  @ApiProperty({ description: 'Whether the item has stock levels set at this site' })
  hasStockLevels: boolean;

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
    description: 'Max level at this site, in the primary unit; null when not set',
    nullable: true,
  })
  maxStockLevel: number | null;

  @ApiProperty({ description: 'Quantity on hand at this site, in the primary unit' })
  onHand: number;

  @ApiProperty({
    description: 'Value of the stock on hand at this site, in the site currency',
    type: () => CurrencyAmountDto,
  })
  stockValue: CurrencyAmountDto;

  @ApiPropertyOptional({
    description: 'Where the on-hand quantity sits against the stock levels; null when they are not set',
    enum: STOCK_STATUSES,
    nullable: true,
  })
  stockStatus: StockStatus | null;

  @ApiProperty({
    description: 'The locations holding the on-hand quantity, largest first',
    type: [SiteStockLocationResponseDto],
  })
  locations: SiteStockLocationResponseDto[];
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
