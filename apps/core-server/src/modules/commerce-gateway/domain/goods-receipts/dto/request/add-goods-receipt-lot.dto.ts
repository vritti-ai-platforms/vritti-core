import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { SITE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { FieldPermission } from '@/rbac/decorators';

export class AddGoodsReceiptLotDto {
  @Trim({ nullify: false })
  @ApiProperty({ description: 'Lot number (must not already exist on inventory_item_lots)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lotNumber: string;

  @ApiPropertyOptional({ description: 'Manufacturing date' })
  @IsOptional()
  @IsDateString()
  manufacturingDate?: string | null;

  @ApiProperty({ description: 'Expiry date (required)' })
  @IsDateString()
  @IsNotEmpty()
  expiryDate: string;

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
