import { ApiProperty } from '@nestjs/swagger';
import { TableResponseDto } from '@vritti/api-sdk';
import { InventoryItemLotResponseDto } from './inventory-item-lot-response.dto';

export class InventoryItemLotTableResponseDto extends TableResponseDto<InventoryItemLotResponseDto> {
  @ApiProperty({ type: [InventoryItemLotResponseDto] })
  declare result: InventoryItemLotResponseDto[];
}
