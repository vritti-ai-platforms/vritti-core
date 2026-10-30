import { ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { SITE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { IsBoolean, IsDateString, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { FieldPermission } from '@/rbac/decorators';

export class UpdateSiteSupplierItemPriceDto {
  @ApiPropertyOptional({ type: CurrencyAmountDto, description: 'Unit price for this validity window' })
  @IsOptional()
  @IsCurrency()
  unitPrice?: CurrencyAmountDto;

  @ApiPropertyOptional({ description: 'Free-goods scheme buy qty (e.g. 9 in "9+1").' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  schemeBuyQty?: number | null;

  @ApiPropertyOptional({ description: 'Free-goods scheme free qty (e.g. 1 in "9+1").' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  schemeFreeQty?: number | null;

  @ApiPropertyOptional({ description: 'Whether the quoted price includes tax', default: false })
  @IsOptional()
  @IsBoolean()
  taxInclusive?: boolean;

  @ApiPropertyOptional({ description: 'Date the price expires (ISO date); null re-opens the window', nullable: true })
  @IsOptional()
  @IsDateString()
  validTo?: string | null;

  @FieldPermission([SITE_INVENTORY_ITEMS.mrp.edit])
  @ApiPropertyOptional({ description: 'MRP this price was agreed against (inventory item MRP id)', nullable: true })
  @IsOptional()
  @IsUUID('7')
  mrpId?: string | null;
}
