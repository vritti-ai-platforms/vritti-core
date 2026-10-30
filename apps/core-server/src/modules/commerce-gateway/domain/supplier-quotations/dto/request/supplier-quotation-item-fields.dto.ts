import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { LE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { IsBoolean, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { FieldPermission } from '@/rbac/decorators';

export class SupplierQuotationItemFieldsDto {
  @Trim()
  @ApiPropertyOptional({
    description: "Supplier's code for the item; used when posting creates the supplier item",
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  supplierItemCode?: string | null;

  @ApiProperty({ type: CurrencyAmountDto, description: "Quoted price in the supplier item's unit and currency" })
  @IsCurrency()
  unitPrice: CurrencyAmountDto;

  @FieldPermission([LE_INVENTORY_ITEMS.mrp.edit])
  @ApiPropertyOptional({
    type: CurrencyAmountDto,
    description: "MRP printed on the pack, in the line's unit; recorded on the item's MRPs when new",
    nullable: true,
  })
  @IsOptional()
  @IsCurrency()
  mrp?: CurrencyAmountDto | null;

  @ApiPropertyOptional({ description: 'Scheme: quantity bought for the free quantity', example: 10, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  schemeBuyQty?: number | null;

  @ApiPropertyOptional({ description: 'Scheme: free quantity per bought block', example: 1, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  schemeFreeQty?: number | null;

  @ApiPropertyOptional({ description: 'Whether the price includes tax', default: false })
  @IsOptional()
  @IsBoolean()
  taxInclusive?: boolean;
}
