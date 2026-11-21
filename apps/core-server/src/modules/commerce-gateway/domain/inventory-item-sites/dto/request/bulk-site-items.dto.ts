import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class BulkSiteItemsDto {
  @ApiProperty({ type: [String], description: 'Inventory item IDs the action applies to', maxItems: 500 })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(500)
  @IsUUID('7', { each: true })
  inventoryItemIds: string[];
}
