import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SupplierItemSiteResponseDto {
  @ApiProperty({ description: 'Supplier item site override ID' })
  id: string;

  @ApiProperty({ description: 'Supplier item ID the override belongs to' })
  supplierItemId: string;

  @ApiProperty({ description: 'Site the override applies to' })
  siteId: string;

  @ApiPropertyOptional({ description: 'Site name (gateway-enriched, not sortable)', nullable: true })
  siteName: string | null;

  @ApiPropertyOptional({ description: 'Site code (gateway-enriched, not sortable)', nullable: true })
  siteCode: string | null;

  @ApiPropertyOptional({ description: 'Site-specific lead time in days', nullable: true })
  leadTimeDays: number | null;

  @ApiPropertyOptional({ description: 'Site-specific minimum order quantity', nullable: true })
  minOrderQuantity: number | null;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;
}
