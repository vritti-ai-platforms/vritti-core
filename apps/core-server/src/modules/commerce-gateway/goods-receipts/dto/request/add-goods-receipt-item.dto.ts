import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsUUID, Min, ValidateNested } from 'class-validator';

export class AddGoodsReceiptItemDto {
  @ApiProperty({ description: 'Supplier item ID — server resolves to the canonical inventory item.' })
  @IsUUID()
  supplierItemId: string;

  @ApiPropertyOptional({ description: 'Damage-on-arrival quantity (does not go to inventory).' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rejectedQuantity?: number;

  @ApiPropertyOptional({
    type: CurrencyAmountDto,
    description: 'Supplier unit price captured at the breakdown step. Pre-filled from PO when linked, else from supplier_items; user may edit. Required for auto-associating SUPPLIER_PRICE at publish.',
  })
  @IsOptional()
  @ValidateNested()
  @IsCurrency()
  @Type(() => CurrencyAmountDto)
  unitPrice?: CurrencyAmountDto;
}
