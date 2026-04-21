import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SupplierItemResponseDto {
  @ApiProperty({ description: 'Supplier item link ID' })
  id: string;

  @ApiProperty({ description: 'Inventory item ID' })
  inventoryItemId: string;

  @ApiPropertyOptional({ description: 'Inventory item name', nullable: true })
  inventoryItemName: string | null;

  @ApiPropertyOptional({ description: 'Supplier-specific item code', nullable: true })
  supplierItemCode: string | null;

  @ApiPropertyOptional({ description: 'Unit price', nullable: true })
  unitPrice: number | null;

  @ApiProperty({ description: 'UOM ID' })
  uomId: string;

  @ApiProperty({ description: 'UOM symbol' })
  uomSymbol: string;

  @ApiPropertyOptional({ description: 'Minimum order quantity', nullable: true })
  minOrderQuantity: number | null;

  @ApiPropertyOptional({ description: 'Lead time in days', nullable: true })
  leadTimeDays: number | null;

  @ApiProperty({ description: 'Whether this is the preferred supplier for this item' })
  isPreferred: boolean;

  @ApiProperty({ description: 'Whether this supplier-item link is active' })
  isActive: boolean;
}
