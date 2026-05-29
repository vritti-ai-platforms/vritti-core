import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsUUID, Min, ValidateNested } from 'class-validator';

export class AddGoodsReceiptItemDto {
  @ApiProperty({ description: 'Inventory item ID — resolved client-side from the PO line or supplier catalog selector.' })
  @IsUUID()
  inventoryItemId: string;

  @ApiProperty({ description: 'UOM ID — must match a PO line UOM when the GR is linked to a PO.' })
  @IsUUID()
  uomId: string;

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
