import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class AddSupplierItemDto {
  @ApiProperty({ description: 'Inventory item ID to link' })
  @IsUUID('7')
  @IsNotEmpty()
  inventoryItemId: string;

  @Trim()
  @ApiPropertyOptional({ description: 'Supplier-specific item code' })
  @IsOptional()
  @IsString()
  supplierItemCode?: string | null;

  @ApiProperty({ description: 'UOM ID for pricing' })
  @IsUUID('7')
  @IsNotEmpty()
  uomId: string;

  @ApiPropertyOptional({ description: "The least the supplier sells per order, in the item's unit", example: 10 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  minOrderQuantity?: number;

  @ApiPropertyOptional({
    description: 'Days from order to delivery; every site that does not set its own follows it',
    example: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number;

  @ApiProperty({ type: [String], description: 'Enrolled sites to set the item up at' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('7', { each: true })
  siteIds: string[];
}
