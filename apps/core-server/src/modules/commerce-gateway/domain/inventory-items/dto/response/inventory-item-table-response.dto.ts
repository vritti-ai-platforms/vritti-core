import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/data-table';
import { InventoryItemResponseDto } from './inventory-item-response.dto';

export class InventoryItemTableResponseDto extends TableResponseDto<InventoryItemResponseDto> {
  @ApiProperty({ type: [InventoryItemResponseDto] })
  declare result: InventoryItemResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty()
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
