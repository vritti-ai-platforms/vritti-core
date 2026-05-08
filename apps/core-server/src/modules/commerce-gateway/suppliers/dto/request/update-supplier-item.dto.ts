import { ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk';
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class UpdateSupplierItemDto {
  @ApiPropertyOptional({ description: 'Supplier-specific item code' })
  @IsOptional()
  @IsString()
  supplierItemCode?: string | null;

  @ApiPropertyOptional({ type: CurrencyAmountDto, description: 'Unit price from this supplier' })
  @IsOptional()
  @IsCurrency()
  unitPrice?: CurrencyAmountDto | null;

  @ApiPropertyOptional({ description: 'UOM ID for pricing' })
  @IsOptional()
  @IsUUID()
  uomId?: string;

  @ApiPropertyOptional({ description: 'Minimum order quantity', example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minOrderQuantity?: number | null;

  @ApiPropertyOptional({ description: 'Lead time in days for this item', example: 5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number | null;

  @ApiPropertyOptional({ description: 'Whether this is the preferred supplier for this item' })
  @IsOptional()
  @IsBoolean()
  isPreferred?: boolean;

  @ApiPropertyOptional({ description: 'Whether this supplier link is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
