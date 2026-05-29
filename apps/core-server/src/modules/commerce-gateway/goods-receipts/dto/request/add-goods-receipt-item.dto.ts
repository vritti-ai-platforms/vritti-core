import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsUUID, Min, ValidateNested } from 'class-validator';

export class AddGoodsReceiptItemFromSupplierItemDto {
  @ApiProperty({ description: 'Supplier item row ID — server resolves to (inventoryItemId, uomId).' })
  @IsUUID()
  supplierItemId: string;

  @ApiPropertyOptional({ description: 'Damage-on-arrival quantity (does not go to inventory).' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rejectedQuantity?: number;

  @ApiPropertyOptional({
    type: CurrencyAmountDto,
    description: 'Supplier unit price captured at the breakdown step. Pre-filled from the supplier catalog; user may edit. Required for auto-associating SUPPLIER_PRICE at publish.',
  })
  @IsOptional()
  @ValidateNested()
  @IsCurrency()
  @Type(() => CurrencyAmountDto)
  unitPrice?: CurrencyAmountDto;
}

export class AddGoodsReceiptItemFromPurchaseOrderItemDto {
  @ApiProperty({ description: 'Purchase order line ID — server resolves to (inventoryItemId, uomId) after verifying it belongs to the GR\'s linked PO.' })
  @IsUUID()
  purchaseOrderItemId: string;

  @ApiPropertyOptional({ description: 'Damage-on-arrival quantity (does not go to inventory).' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rejectedQuantity?: number;

  @ApiPropertyOptional({
    type: CurrencyAmountDto,
    description: 'Supplier unit price captured at the breakdown step. Pre-filled from the PO line; user may edit if the supplier delivered at a different price.',
  })
  @IsOptional()
  @ValidateNested()
  @IsCurrency()
  @Type(() => CurrencyAmountDto)
  unitPrice?: CurrencyAmountDto;
}
