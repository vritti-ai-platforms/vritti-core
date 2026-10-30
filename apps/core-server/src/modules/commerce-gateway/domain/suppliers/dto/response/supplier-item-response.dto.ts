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

  @ApiProperty({ description: 'UOM ID' })
  uomId: string;

  @ApiProperty({ description: 'UOM symbol' })
  uomSymbol: string;

  @ApiPropertyOptional({ description: "The least the supplier sells per order, in the item's unit", nullable: true })
  minOrderQuantity: number | null;

  @ApiPropertyOptional({
    description: 'Days from order to delivery, which every site follows unless it sets its own',
    nullable: true,
  })
  leadTimeDays: number | null;

  @ApiProperty({ description: 'Number of sites that carry this item' })
  siteCount: number;

  @ApiProperty({ description: 'Number of sites where this supplier is preferred for the item' })
  preferredSiteCount: number;

  @ApiPropertyOptional({ description: 'Price rows of the item at all sites (item detail only)' })
  priceCount?: number;

  @ApiPropertyOptional({ description: 'Sites the item has prices at (item detail only)' })
  pricedSiteCount?: number;

  @ApiPropertyOptional({
    description: 'False once the item has any price — price history is never deleted (item detail only)',
  })
  canDelete?: boolean;
}
