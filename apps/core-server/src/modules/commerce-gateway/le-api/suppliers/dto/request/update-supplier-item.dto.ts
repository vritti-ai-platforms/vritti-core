import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class UpdateSupplierItemDto {
  @Trim()
  @ApiPropertyOptional({ description: 'Supplier-specific item code' })
  @IsOptional()
  @IsString()
  supplierItemCode?: string | null;

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

  @ApiPropertyOptional({ description: 'Standing free-goods scheme buy qty (e.g. 9 in "9+1").' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  schemeBuyQty?: number | null;

  @ApiPropertyOptional({ description: 'Standing free-goods scheme free qty (e.g. 1 in "9+1").' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  schemeFreeQty?: number | null;

  @ApiPropertyOptional({ description: 'Whether a free-goods scheme applies.' })
  @IsOptional()
  @IsBoolean()
  hasScheme?: boolean;

  @ApiPropertyOptional({ description: 'Whether the unit price is quoted tax-inclusive.' })
  @IsOptional()
  @IsBoolean()
  taxInclusive?: boolean;
}
