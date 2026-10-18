import { VariantFacetResponseDto } from '@commerce/offerings/dto/response/variant-facet-response.dto';
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
  @ApiProperty() code: string;
  @ApiProperty({ description: 'The offering\u2019s name \u2014 a variant has none of its own' }) offeringName: string;

  @ApiProperty({ type: [VariantFacetResponseDto], description: 'What tells this variant from its siblings' })
  dimensions: VariantFacetResponseDto[];

  @ApiProperty({ description: 'False when the variant or its offering is deactivated — no channel can sell it' })
  isActive: boolean;

  @ApiProperty({
    description: 'Where the listing stands, ready to render: "2 of 2" channels, or what stops it',
    example: '2 of 2',
  })
  availability: string;

  @ApiProperty({ description: 'Channels this catalog reaches — the table reads it rather than fetching them' })
  channelCount: number;

  @ApiProperty({ description: 'Currencies this catalog declares — the denominator for how many priced it' })
  currencyCount: number;

  @ApiPropertyOptional({ nullable: true }) legalEntityId: string | null;
  @ApiPropertyOptional({ nullable: true }) siteId: string | null;

  @ApiProperty({ enum: ['ORG', 'LE', 'SITE'], description: 'Workspace that owns this listing' })
  ownerScope: 'ORG' | 'LE' | 'SITE';

  @ApiProperty({ description: 'Name of the owning workspace, resolved from core' })
  ownerName: string;

  @ApiProperty({ description: 'False when the listing belongs to a wider scope than this workspace' })
  canDelete: boolean;
  @ApiPropertyOptional({ type: CurrencyAmountDto, nullable: true }) mrp: CurrencyAmountDto | null;
  @ApiProperty({
    type: [String],
    description: 'Channels this listing is excluded from; absent means available everywhere the catalog reaches',
  })
  excludedChannelIds: string[];

  @ApiProperty({ type: [CatalogListingPriceResponseDto] }) prices: CatalogListingPriceResponseDto[];
}
