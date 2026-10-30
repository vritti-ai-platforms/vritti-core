import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { SITE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { FieldPermission } from '@/rbac/decorators';

export class UpdateGoodsReceiptLotDto {
  @Trim()
  @ApiPropertyOptional({ description: 'Lot number' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lotNumber?: string | null;

  @ApiPropertyOptional({ description: 'Manufacturing date', nullable: true })
  @IsOptional()
  @IsDateString()
  manufacturingDate?: string | null;

  @ApiPropertyOptional({ description: 'Expiry date (cannot be cleared once set)' })
  @IsOptional()
  @IsDateString()
  @IsNotEmpty()
  expiryDate?: string;

  @FieldPermission([SITE_INVENTORY_ITEMS.mrp.edit])
  @ApiPropertyOptional({
    type: CurrencyAmountDto,
    description: 'Printed MRP per primary unit (site currency)',
    nullable: true,
  })
  @IsOptional()
  @IsCurrency()
  mrp?: CurrencyAmountDto | null;
}
