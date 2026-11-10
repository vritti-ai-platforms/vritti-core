import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, Min, ValidateIf } from 'class-validator';

export class UpdateSupplierItemDto {
  @Trim()
  @ApiPropertyOptional({ description: 'Supplier-specific item code' })
  @IsOptional()
  @IsString()
  supplierItemCode?: string | null;

  @ApiPropertyOptional({ description: 'UOM ID for pricing' })
  @IsOptional()
  @IsUUID('7')
  uomId?: string;

  @ApiPropertyOptional({ description: "The least the supplier sells per order, in the item's unit", nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  minOrderQuantity?: number | null;

  @ApiPropertyOptional({
    description:
      'Whole days from order to delivery, 0 for the same day; every site that does not set its own follows it',
    minimum: 0,
    maximum: 365,
    example: 0,
  })
  @ValidateIf((_, value) => value !== undefined)
  @IsInt()
  @Min(0)
  @Max(365)
  defaultLeadTimeDays?: number;
}
