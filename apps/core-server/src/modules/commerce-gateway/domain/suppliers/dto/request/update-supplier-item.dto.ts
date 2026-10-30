import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsInt, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

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
    description: 'Days from order to delivery; every site that does not set its own follows it',
    example: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number | null;
}
