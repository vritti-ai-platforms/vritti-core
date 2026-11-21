import { ApiProperty } from '@nestjs/swagger';

export class CreatedInventoryItemResponseDto {
  @ApiProperty({ description: 'The new inventory item' })
  id: string;

  @ApiProperty({ description: 'Its SKU' })
  sku: string;
}
