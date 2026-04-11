import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InventoryBatchResponseDto {
  @ApiProperty({ description: 'Inventory batch ID' })
  id: string;

  @ApiProperty({ description: 'Inventory item ID' })
  inventoryItemId: string;

  @ApiProperty({ description: 'Storage location ID' })
  locationId: string;

  @ApiPropertyOptional({ description: 'Storage location name', nullable: true })
  locationName: string | null;

  @ApiPropertyOptional({ description: 'Batch number', nullable: true })
  batchNumber: string | null;

  @ApiProperty({ description: 'Current quantity in stock' })
  quantity: number;

  @ApiProperty({ description: 'Quantity reserved for orders' })
  reservedQuantity: number;

  @ApiProperty({ description: 'Available quantity (quantity minus reserved)' })
  availableQuantity: number;

  @ApiPropertyOptional({ description: 'ISO date of manufacturing', nullable: true })
  manufacturingDate: string | null;

  @ApiPropertyOptional({ description: 'ISO date of expiry', nullable: true })
  expiryDate: string | null;

  @ApiPropertyOptional({ description: 'Goods receipt item ID linked to this batch', nullable: true })
  goodsReceiptItemId: string | null;

  @ApiProperty({ description: 'Whether the batch can be deleted' })
  canDelete: boolean;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}
