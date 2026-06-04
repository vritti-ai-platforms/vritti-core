import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk';

export class SupplierItemResponseDto {
  @ApiProperty({ description: 'Supplier item link ID' })
  id: string;

  @ApiProperty({ description: 'Inventory item ID' })
  inventoryItemId: string;

  @ApiPropertyOptional({ description: 'Inventory item name', nullable: true })
  inventoryItemName: string | null;

  @ApiPropertyOptional({ description: 'Supplier-specific item code', nullable: true })
  supplierItemCode: string | null;

  @ApiPropertyOptional({ type: CurrencyAmountDto, nullable: true })
  unitPrice: CurrencyAmountDto | null;

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

  @ApiPropertyOptional({ description: 'Standing free-goods scheme buy qty (e.g. 9 in "9+1").', nullable: true })
  schemeBuyQty: number | null;

  @ApiPropertyOptional({ description: 'Standing free-goods scheme free qty (e.g. 1 in "9+1").', nullable: true })
  schemeFreeQty: number | null;

  @ApiProperty({ description: 'Whether a free-goods scheme applies.' })
  hasScheme: boolean;
}
