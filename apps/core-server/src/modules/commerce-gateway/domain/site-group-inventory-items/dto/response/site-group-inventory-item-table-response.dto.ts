import { InventoryItemResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-response.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/data-table';

export class SiteGroupInventoryItemTableRowDto extends InventoryItemResponseDto {
  @ApiProperty({ description: "How many of the group's sites have the item enabled" })
  enabledSiteCount: number;
}

export class SiteGroupInventoryItemTableResponseDto extends TableResponseDto<SiteGroupInventoryItemTableRowDto> {
  @ApiProperty({ type: [SiteGroupInventoryItemTableRowDto] })
  declare result: SiteGroupInventoryItemTableRowDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty()
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
