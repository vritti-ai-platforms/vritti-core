import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsBoolean, IsNumber, IsOptional, IsPositive, IsUUID, Min } from 'class-validator';

export class AddGoodsReceiptItemFromSupplierItemDto {
  @ApiProperty({ description: 'Supplier item row ID — server resolves to (inventoryItemId, uomId).' })
  @IsUUID()
  supplierItemId: string;

  @ApiProperty({
    description: 'Ordered (paid) quantity for this item, in the item UOM. Free qty is derived from the scheme.',
  })
  @IsNumber()
  @IsPositive()
  orderedQty: number;

  @ApiPropertyOptional({ description: 'Damage-on-arrival quantity (does not go to inventory).' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rejectedQuantity?: number;

  @ApiPropertyOptional({
    type: CurrencyAmountDto,
    description:
      'Supplier unit price captured at the breakdown step. Pre-filled from the supplier catalog; user may edit. Required at publish (cost is spread across the total received quantity).',
  })
  @IsOptional()
  @IsCurrency()
  unitPrice?: CurrencyAmountDto;

  @ApiPropertyOptional({
    description: 'Free-goods scheme buy qty (e.g. 9 in "9+1"). Prefilled from the supplier item.',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  schemeBuyQty?: number;

  @ApiPropertyOptional({ description: 'Free-goods scheme free qty (e.g. 1 in "9+1").' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  schemeFreeQty?: number;

  @ApiPropertyOptional({ description: 'Whether a free-goods scheme applies.' })
  @IsOptional()
  @IsBoolean()
  hasScheme?: boolean;
}

export class AddGoodsReceiptItemFromPurchaseOrderItemDto {
  @ApiProperty({
    description:
      "Purchase order line ID — server resolves to (inventoryItemId, uomId) after verifying it belongs to the GR's linked PO.",
  })
  @IsUUID()
  purchaseOrderItemId: string;

  @ApiProperty({
    description:
      'Ordered (paid) quantity for this item, in the item UOM. Capped by the PO line remaining quantity; free qty is derived from the scheme.',
  })
  @IsNumber()
  @IsPositive()
  orderedQty: number;

  @ApiPropertyOptional({ description: 'Damage-on-arrival quantity (does not go to inventory).' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rejectedQuantity?: number;

  @ApiPropertyOptional({
    type: CurrencyAmountDto,
    description:
      'Supplier unit price captured at the breakdown step. Pre-filled from the PO line; user may edit if the supplier delivered at a different price.',
  })
  @IsOptional()
  @IsCurrency()
  unitPrice?: CurrencyAmountDto;

  @ApiPropertyOptional({
    type: CurrencyAmountDto,
    description: 'Printed MRP per primary unit (site currency)',
    nullable: true,
  })
  @IsOptional()
  @IsCurrency()
  mrp?: CurrencyAmountDto | null;

  @ApiPropertyOptional({ description: 'Free-goods scheme buy qty (e.g. 9 in "9+1"). Prefilled from the PO line.' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  schemeBuyQty?: number;

  @ApiPropertyOptional({ description: 'Free-goods scheme free qty (e.g. 1 in "9+1").' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  schemeFreeQty?: number;

  @ApiPropertyOptional({ description: 'Whether a free-goods scheme applies.' })
  @IsOptional()
  @IsBoolean()
  hasScheme?: boolean;
}
