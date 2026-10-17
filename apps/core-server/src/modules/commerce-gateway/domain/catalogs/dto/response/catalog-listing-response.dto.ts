import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';

export class CatalogListingPriceResponseDto {
  @ApiProperty() id: string;
  @ApiPropertyOptional({ nullable: true }) legalEntityId: string | null;
  @ApiPropertyOptional({ nullable: true }) siteId: string | null;

  @ApiProperty({ enum: ['ORG', 'LE', 'SITE'], description: 'Workspace that set this price' })
  ownerScope: 'ORG' | 'LE' | 'SITE';

  @ApiProperty({ description: 'Name of that workspace, resolved from core' })
  ownerName: string;

  @ApiProperty({ description: 'False when inherited from a wider workspace, which may be overridden but not edited' })
  canEdit: boolean;

  @ApiProperty({ type: CurrencyAmountDto }) price: CurrencyAmountDto;
}

export class CatalogListingResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() catalogId: string;
  @ApiProperty() offeringVariantId: string;
  @ApiProperty() code: string;
  @ApiProperty() variantName: string;
  @ApiPropertyOptional({ nullable: true }) legalEntityId: string | null;
  @ApiPropertyOptional({ nullable: true }) siteId: string | null;

  @ApiProperty({ enum: ['ORG', 'LE', 'SITE'], description: 'Workspace that owns this listing' })
  ownerScope: 'ORG' | 'LE' | 'SITE';

  @ApiProperty({ description: 'Name of the owning workspace, resolved from core' })
  ownerName: string;

  @ApiProperty({ description: 'False when the listing belongs to a wider scope than this workspace' })
  canEdit: boolean;

  @ApiProperty({ description: 'False when the listing belongs to a wider scope than this workspace' })
  canDelete: boolean;
  @ApiPropertyOptional({ nullable: true, description: 'MRP slice this listing covers' })
  inventoryItemMrpId: string | null;
  @ApiPropertyOptional({ type: CurrencyAmountDto, nullable: true }) mrp: CurrencyAmountDto | null;
  @ApiPropertyOptional({ nullable: true }) mrpUomSymbol: string | null;
  @ApiProperty({
    type: [String],
    description: 'Channels this listing is excluded from; absent means available everywhere the catalog reaches',
  })
  excludedChannelIds: string[];

  @ApiProperty({ type: [CatalogListingPriceResponseDto] }) prices: CatalogListingPriceResponseDto[];
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}

export class CatalogListingMrpOptionResponseDto {
  @ApiProperty() id: string;
  @ApiProperty({ type: CurrencyAmountDto }) mrp: CurrencyAmountDto;
  @ApiPropertyOptional({ nullable: true }) uomSymbol: string | null;
  @ApiProperty({ description: 'The MRP currently printed on new stock' }) isCurrent: boolean;
}
