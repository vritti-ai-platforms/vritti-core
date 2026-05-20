import { ApiProperty } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk';

export class PurchaseOrderItemResponseDto {
  @ApiProperty({ description: 'Purchase order item ID' })
  id: string;

  @ApiProperty({ description: 'Inventory item ID' })
  inventoryItemId: string;

  @ApiProperty({ description: 'Inventory item name', nullable: true })
  inventoryItemName: string | null;

  @ApiProperty({ description: 'Ordered quantity' })
  quantity: number;

  @ApiProperty({ description: 'Received quantity' })
  receivedQuantity: number;

  @ApiProperty({ type: CurrencyAmountDto })
  supplierUnitPrice: CurrencyAmountDto;

  @ApiProperty({ type: CurrencyAmountDto })
  unitPrice: CurrencyAmountDto;

  @ApiProperty({ type: CurrencyAmountDto })
  totalPrice: CurrencyAmountDto;
}
