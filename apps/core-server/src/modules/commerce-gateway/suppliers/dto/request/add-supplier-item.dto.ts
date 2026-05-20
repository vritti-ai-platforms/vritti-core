import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class AddSupplierItemDto {
  @ApiProperty({ description: 'Inventory item ID to link' })
  @IsUUID()
  @IsNotEmpty()
  inventoryItemId: string;

  @ApiPropertyOptional({ description: 'Supplier-specific item code' })
  @IsOptional()
  @IsString()
  supplierItemCode?: string;

  @ApiPropertyOptional({ type: CurrencyAmountDto, description: 'Unit price from this supplier' })
  @IsOptional()
  @IsCurrency()
  unitPrice?: CurrencyAmountDto;

  @ApiProperty({ description: 'UOM ID for pricing' })
  @IsUUID()
  @IsNotEmpty()
  uomId: string;

  @ApiPropertyOptional({ description: 'Minimum order quantity', example: 10 })
  @IsOptional()
  @IsInt()
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
