import { ApiProperty } from '@nestjs/swagger';
import { TableResponseDto } from '@vritti/api-sdk/database';
import { InventoryItemQuantResponseDto } from './inventory-item-quant-response.dto';

export class InventoryItemQuantTableResponseDto extends TableResponseDto<InventoryItemQuantResponseDto> {
  @ApiProperty({ type: [InventoryItemQuantResponseDto] })
  declare result: InventoryItemQuantResponseDto[];
}
