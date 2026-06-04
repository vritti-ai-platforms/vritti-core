import { ApiProperty } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk';

export class PurchaseOrderItemResponseDto {
  @ApiProperty({ description: 'Purchase order item ID' })
  id: string;

  @ApiProperty({ description: 'Inventory item ID' })
  inventoryItemId: string;

  @ApiProperty({ description: 'Inventory item name', nullable: true })
  inventoryItemName: string | null;

  @ApiProperty({ description: 'Ordered quantity in the line UOM' })
  uomQty: number;

  @ApiProperty({ description: 'Received quantity' })
  receivedQuantity: number;

  @ApiProperty({ description: 'Line currency code (ISO 4217) — snapshot from PO header' })
  currencyCode: string;

  @ApiProperty({ type: CurrencyAmountDto, description: 'Unit price in PO/supplier currency' })
  unitPrice: CurrencyAmountDto;

  @ApiProperty({ type: CurrencyAmountDto, description: 'Line total in PO/supplier currency' })
  totalPrice: CurrencyAmountDto;

  @ApiProperty({ description: 'Free-goods scheme buy qty (e.g. 9 in "9+1").', nullable: true })
  schemeBuyQty: number | null;

  @ApiProperty({ description: 'Free-goods scheme free qty (e.g. 1 in "9+1").', nullable: true })
  schemeFreeQty: number | null;

  @ApiProperty({ description: 'Whether a free-goods scheme applies.' })
  hasScheme: boolean;

  @ApiProperty({ description: 'Derived free (bonus) quantity from the scheme.' })
  freeQty: number;
}
