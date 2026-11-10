import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { InventoryItemMrpResponseDto } from './inventory-item-mrp-response.dto';

export class InventoryItemMrpTableResponseDto extends TableResponseDto<InventoryItemMrpResponseDto> {
  @ApiProperty({ type: [InventoryItemMrpResponseDto] })
  declare result: InventoryItemMrpResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty()
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
