import { ApiProperty } from '@nestjs/swagger';

export class CatalogResponseDto {
  @ApiProperty({ description: 'Catalog ID' })
  id: string;

  @ApiProperty({ description: 'Business unit ID' })
  businessUnitId: string;

  @ApiProperty({ description: 'Catalog name' })
  name: string;

  @ApiProperty({ description: 'ISO 4217 currency code (snapshot of the BU currency at creation)' })
  currencyCode: string;

  @ApiProperty({ description: 'Whether catalog prices are tax-inclusive' })
  taxInclusive: boolean;

  @ApiProperty({ description: 'Whether the catalog is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Number of (business unit, channel) pairs this catalog is assigned to' })
  channelCount: number;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}
