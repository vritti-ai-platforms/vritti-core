import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PURCHASE_ITEM_SOURCES, type PurchaseItemSource } from '../../constants/purchase.constants';

export class PurchaseItemResponseDto {
  @ApiProperty({ description: 'Purchase item ID' })
  id: string;

  @ApiProperty({ description: 'Inventory item ID' })
  inventoryItemId: string;

  @ApiProperty({ description: 'Inventory item name' })
  inventoryItemName: string;

  @ApiProperty({ description: 'Inventory item code' })
  inventoryItemCode: string;

  @ApiProperty({ description: "Symbol of the item's primary unit" })
  primaryUomSymbol: string;

  @ApiProperty({ description: "Quantity needed, in the item's primary unit" })
  primaryQty: number;

  @ApiProperty({ description: "Quantity allocated to suppliers, in the item's primary unit" })
  allocatedPrimaryQty: number;

  @ApiProperty({ description: 'Where the item came from', enum: PURCHASE_ITEM_SOURCES })
  source: PurchaseItemSource;

  @ApiPropertyOptional({ description: 'Record the item came from', type: String, nullable: true })
  sourceId: string | null;

  @ApiPropertyOptional({ description: 'Date the item is needed by (YYYY-MM-DD)', type: String, nullable: true })
  neededBy: string | null;

  @ApiPropertyOptional({ description: 'Notes', type: String, nullable: true })
  notes: string | null;
}
