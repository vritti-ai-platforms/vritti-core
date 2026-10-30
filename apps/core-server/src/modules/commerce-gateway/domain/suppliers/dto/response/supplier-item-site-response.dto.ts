import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SupplierItemSiteResponseDto {
  @ApiProperty({ description: 'Supplier item site row ID' })
  id: string;

  @ApiProperty({ description: 'Supplier item ID' })
  supplierItemId: string;

  @ApiProperty({ description: 'Legal entity that owns the row' })
  legalEntityId: string;

  @ApiProperty({ description: 'Site that carries the item' })
  siteId: string;

  @ApiProperty({ description: 'Inventory item ID' })
  inventoryItemId: string;

  @ApiProperty({ description: 'Whether this is the preferred supplier for the item at the site' })
  isPreferred: boolean;

  @ApiPropertyOptional({ description: 'Site name (gateway-enriched, not sortable)', nullable: true })
  siteName: string | null;

  @ApiPropertyOptional({ description: 'Site code (gateway-enriched, not sortable)', nullable: true })
  siteCode: string | null;

  @ApiPropertyOptional({
    description: "Lead time in days at the site — the item's unless the site sets its own",
    nullable: true,
  })
  leadTimeDays: number | null;

  @ApiProperty({ description: "True when the site sets its own lead time instead of following the supplier item's" })
  isLeadTimeOverridden: boolean;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;
}
