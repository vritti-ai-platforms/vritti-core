import { ApiProperty } from '@nestjs/swagger';

export class CreatedVariantInventoryItemResponseDto {
  @ApiProperty({ description: "The inventory item created as the variant's component" })
  inventoryItemId: string;

  @ApiProperty({ description: "Its SKU — the variant's code" })
  sku: string;
}
