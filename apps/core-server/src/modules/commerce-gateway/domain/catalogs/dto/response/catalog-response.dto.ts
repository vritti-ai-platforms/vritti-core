import { ApiProperty } from '@nestjs/swagger';

export class CatalogResponseDto {
  @ApiProperty({ description: 'Catalog ID' })
  id: string;

  @ApiProperty({ description: 'Site ID' })
  siteId: string;

  @ApiProperty({ description: 'Catalog name' })
  name: string;

  @ApiProperty({ description: 'ISO 4217 currency code (snapshot of the site currency at creation)' })
  currencyCode: string;

  @ApiProperty({ description: 'Whether catalog prices are tax-inclusive' })
  taxInclusive: boolean;

  @ApiProperty({ description: 'Whether the catalog is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Number of (sites, channel) pairs this catalog is assigned to' })
  channelCount: number;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}
