import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PurchaseOrderItemResponseDto {
  @ApiProperty({ description: 'Purchase order item ID' })
  id: string;

  @ApiProperty({ description: 'Inventory item ID' })
  inventoryItemId: string;

  @ApiPropertyOptional({ description: 'Inventory item name', nullable: true })
  inventoryItemName: string | null;

  @ApiProperty({ description: 'Ordered quantity' })
  orderedQuantity: number;

  @ApiProperty({ description: 'Received quantity' })
  receivedQuantity: number;

  @ApiPropertyOptional({ description: 'Unit price', nullable: true })
  unitPrice: number | null;

  @ApiPropertyOptional({ description: 'Total price', nullable: true })
  totalPrice: number | null;
}
