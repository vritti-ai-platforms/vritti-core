import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { LE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { FieldPermission } from '@/rbac/decorators';

export class AddSupplierItemPriceDto {
  @ApiProperty({ type: CurrencyAmountDto, description: 'Unit price for this validity window' })
  @IsNotEmpty()
  @IsCurrency()
  unitPrice: CurrencyAmountDto;

  @ApiPropertyOptional({ description: 'Free-goods scheme buy qty (e.g. 9 in "9+1").' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  schemeBuyQty?: number;

  @ApiPropertyOptional({ description: 'Free-goods scheme free qty (e.g. 1 in "9+1").' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  schemeFreeQty?: number;

  @ApiPropertyOptional({ description: 'Whether the quoted price includes tax', default: false })
  @IsOptional()
  @IsBoolean()
  taxInclusive?: boolean;

  @ApiProperty({ description: 'Date the price becomes valid (ISO date)', example: '2026-08-01' })
  @IsDateString()
  @IsNotEmpty()
  validFrom: string;

  @ApiPropertyOptional({ description: 'Date the price expires (ISO date); open-ended when omitted', nullable: true })
  @IsOptional()
  @IsDateString()
  validTo?: string | null;

  @ApiProperty({ description: 'Sites the price is added for; one price row is created per site', type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('7', { each: true })
  siteIds: string[];

  @FieldPermission([LE_INVENTORY_ITEMS.mrp.edit])
  @ApiPropertyOptional({ description: 'MRP this price was agreed against (inventory item MRP id)', nullable: true })
  @IsOptional()
  @IsUUID('7')
  mrpId?: string | null;

  @ApiPropertyOptional({ description: 'Why the price was set or changed', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string | null;
}
