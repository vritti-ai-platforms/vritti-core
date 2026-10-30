import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/data-table';
import { SiteInventoryItemResponseDto } from './inventory-item-response.dto';

export class SiteInventoryItemTableRowDto extends SiteInventoryItemResponseDto {
  @ApiProperty({ description: 'Whether this site has the item enabled' })
  isEnabled: boolean;

  @ApiPropertyOptional({ description: 'Whether this site stocks the item', nullable: true })
  isStocked: boolean | null;

  @ApiPropertyOptional({ description: 'Reorder point at this site', nullable: true })
  reorderPoint: number | null;

  @ApiProperty({ description: 'Quantity on hand at this site, in the primary unit' })
  stockedQuantity: string;
}

export class SiteInventoryItemTableResponseDto extends TableResponseDto<SiteInventoryItemTableRowDto> {
  @ApiProperty({ type: [SiteInventoryItemTableRowDto] })
  declare result: SiteInventoryItemTableRowDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty()
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
