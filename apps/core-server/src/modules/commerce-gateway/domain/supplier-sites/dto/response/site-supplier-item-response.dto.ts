import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';

export class SiteSupplierItemResponseDto {
  @ApiProperty({ description: 'Supplier item link ID' })
  id: string;

  @ApiProperty({ description: 'Inventory item ID' })
  inventoryItemId: string;

  @ApiPropertyOptional({ description: 'Inventory item name', nullable: true })
  inventoryItemName: string | null;

  @ApiPropertyOptional({ description: "The site's supplier_item_sites row ID", nullable: true })
  itemSiteId: string | null;

  @ApiPropertyOptional({ description: 'Supplier-specific item code', nullable: true })
  supplierItemCode: string | null;

  @ApiPropertyOptional({
    type: CurrencyAmountDto,
    description: 'Unit price in force at this site today',
    nullable: true,
  })
  unitPrice: CurrencyAmountDto | null;

  @ApiProperty({ description: 'UOM ID' })
  uomId: string;

  @ApiProperty({ description: 'UOM symbol' })
  uomSymbol: string;

  @ApiPropertyOptional({ description: "This site's minimum order quantity", nullable: true })
  minOrderQuantity: number | null;

  @ApiPropertyOptional({ description: 'Effective lead time in days', nullable: true })
  leadTimeDays: number | null;

  @ApiProperty({ description: "True when the site sets its own lead time instead of following the supplier item's" })
  isLeadTimeOverridden: boolean;

  @ApiProperty({ description: 'Whether this is the preferred supplier for this item' })
  isPreferred: boolean;

  @ApiPropertyOptional({ description: 'Standing free-goods scheme buy qty (e.g. 9 in "9+1").', nullable: true })
  schemeBuyQty: number | null;

  @ApiPropertyOptional({ description: 'Standing free-goods scheme free qty (e.g. 1 in "9+1").', nullable: true })
  schemeFreeQty: number | null;

  @ApiProperty({ description: 'Whether a free-goods scheme applies.' })
  hasScheme: boolean;

  @ApiProperty({ description: 'Whether the unit price is quoted tax-inclusive.' })
  taxInclusive: boolean;

  @ApiPropertyOptional({ description: 'Price rows of the item at all sites (item detail only)' })
  priceCount?: number;

  @ApiPropertyOptional({ description: 'Sites the item has prices at (item detail only)' })
  pricedSiteCount?: number;

  @ApiPropertyOptional({
    description: 'False once the item has any price — price history is never deleted (item detail only)',
  })
  canDelete?: boolean;
}
