import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/data-table';
import { SiteInventoryItemResponseDto } from './inventory-item-response.dto';

export class SiteInventoryItemTableResponseDto extends TableResponseDto<SiteInventoryItemResponseDto> {
  @ApiProperty({ type: [SiteInventoryItemResponseDto] })
  declare result: SiteInventoryItemResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty()
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
