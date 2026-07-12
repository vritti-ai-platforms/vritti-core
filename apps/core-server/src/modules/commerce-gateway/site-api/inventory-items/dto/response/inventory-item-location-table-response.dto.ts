import { ApiProperty } from '@nestjs/swagger';
import { TableResponseDto } from '@vritti/api-sdk/database';
import { InventoryItemLocationResponseDto } from './inventory-item-location-response.dto';

export class InventoryItemLocationTableResponseDto extends TableResponseDto<InventoryItemLocationResponseDto> {
  @ApiProperty({ type: [InventoryItemLocationResponseDto] })
  declare result: InventoryItemLocationResponseDto[];
}
