import { DisplayUomQuantityResponseDto } from '@commerce/uom/dto/response/display-uom-quantity-response.dto';
import { ApiProperty } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';

export class GoodsReceiptItemCostDisplayResponseDto {
  @ApiProperty({ type: DisplayUomQuantityResponseDto, nullable: true })
  acceptedPrimaryQty: DisplayUomQuantityResponseDto | null;
}

export class GoodsReceiptItemCostResponseDto {
  @ApiProperty({ description: 'Goods receipt item ID' })
  id: string;

  @ApiProperty({ description: 'Inventory item ID' })
  inventoryItemId: string;

  @ApiProperty({ description: 'Inventory item name' })
  inventoryItemName: string;

  @ApiProperty({ description: 'Symbol of the unit the goods are counted in' })
  uomSymbol: string;

  @ApiProperty({ description: "Symbol of the item's primary unit" })
  primaryUomSymbol: string;

  @ApiProperty({ description: 'Received less rejected, in the counted unit' })
  acceptedQty: number;

  @ApiProperty({ description: "Received less rejected, in the item's primary unit" })
  acceptedPrimaryQty: number;

  @ApiProperty({
    type: CurrencyAmountDto,
    description:
      "Provisional cost per primary unit in the legal entity's currency: the PO line total over its ordered and expected free quantity",
  })
  unitCost: CurrencyAmountDto;

  @ApiProperty({ type: CurrencyAmountDto, description: 'Provisional value of the accepted quantity' })
  value: CurrencyAmountDto;

  @ApiProperty({
    type: GoodsReceiptItemCostDisplayResponseDto,
    description: "The accepted primary-unit quantity in the item's display unit",
  })
  display: GoodsReceiptItemCostDisplayResponseDto;
}

export class GoodsReceiptItemsCostResponseDto {
  @ApiProperty({ type: [GoodsReceiptItemCostResponseDto] })
  rows: GoodsReceiptItemCostResponseDto[];

  @ApiProperty({ description: "The legal entity's currency the costs are in" })
  currencyCode: string;

  @ApiProperty({ type: CurrencyAmountDto, description: 'Provisional value of the whole receipt' })
  grandTotal: CurrencyAmountDto;
}
