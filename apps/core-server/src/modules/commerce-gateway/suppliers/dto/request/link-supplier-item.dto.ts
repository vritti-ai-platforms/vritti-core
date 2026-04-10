import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class LinkSupplierItemDto {
  @ApiProperty({ description: 'Inventory item ID to link' })
  @IsUUID()
  @IsNotEmpty()
  inventoryItemId: string;

  @ApiPropertyOptional({ description: 'Supplier-specific item code' })
  @IsOptional()
  @IsString()
  supplierCode?: string;

  @ApiPropertyOptional({ description: 'Unit price from this supplier', example: 12.5 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  unitPrice?: number;

  @ApiPropertyOptional({ description: 'UOM ID for pricing' })
  @IsOptional()
  @IsUUID()
  uomId?: string;

  @ApiPropertyOptional({ description: 'Minimum order quantity', example: 10 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  minOrderQuantity?: number;

  @ApiPropertyOptional({ description: 'Lead time in days for this item', example: 5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number;

  @ApiPropertyOptional({ description: 'Whether this is the preferred supplier for this item', default: false })
  @IsOptional()
  @IsBoolean()
  isPreferred?: boolean;
}
