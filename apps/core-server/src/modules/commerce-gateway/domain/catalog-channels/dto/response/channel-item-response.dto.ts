import { VariantFacetResponseDto } from '@commerce/offerings/dto/response/variant-facet-response.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/data-table';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';

export class ChannelItemResponseDto {
  @ApiProperty() listingId: string;
  @ApiProperty() offeringVariantId: string;
  @ApiProperty() code: string;
  @ApiProperty({ description: 'The offering\u2019s name \u2014 a variant has none of its own' }) offeringName: string;

  @ApiProperty({ type: [VariantFacetResponseDto], description: 'What tells this variant from its siblings' })
  dimensions: VariantFacetResponseDto[];
  @ApiPropertyOptional({ type: CurrencyAmountDto, nullable: true }) mrp: CurrencyAmountDto | null;

  @ApiProperty({ description: 'False when this channel does not carry the item at all' })
  availableHere: boolean;

  @ApiProperty({
    type: [String],
    description: 'Currencies a shopper can buy it in here — declared by the catalog, priced, and withheld from none',
  })
  availableCurrencyCodes: string[];
}

export class ChannelItemTableResponseDto extends TableResponseDto<ChannelItemResponseDto> {
  @ApiProperty({ type: [ChannelItemResponseDto] }) declare result: ChannelItemResponseDto[];
  @ApiProperty() declare count: number;
  @ApiProperty() declare state: TableViewState;
  @ApiPropertyOptional({ nullable: true }) declare activeViewId: string | null;
}

export class ChannelPriceResponseDto {
  @ApiProperty() listingId: string;
  @ApiProperty() offeringVariantId: string;
  @ApiProperty() code: string;
  @ApiProperty({ description: 'The offering\u2019s name \u2014 a variant has none of its own' }) offeringName: string;

  @ApiProperty({ type: [VariantFacetResponseDto], description: 'What tells this variant from its siblings' })
  dimensions: VariantFacetResponseDto[];
  @ApiPropertyOptional({ type: CurrencyAmountDto, nullable: true }) mrp: CurrencyAmountDto | null;

  @ApiPropertyOptional({
    type: CurrencyAmountDto,
    nullable: true,
    description: 'Null when nobody priced it in this currency, which is why it is unavailable here',
  })
  price: CurrencyAmountDto | null;

  @ApiPropertyOptional({ enum: ['ORG', 'LE', 'SITE'], nullable: true, description: 'Workspace that set the price' })
  priceOwnerScope: 'ORG' | 'LE' | 'SITE' | null;

  @ApiPropertyOptional({ nullable: true }) priceLegalEntityId: string | null;
  @ApiPropertyOptional({ nullable: true }) priceSiteId: string | null;

  @ApiProperty({ description: 'Name of the workspace that set the price, resolved from core' })
  priceOwnerName: string | null;

  @ApiProperty({ description: 'False when the item is excluded from this channel in this currency' })
  availableHere: boolean;

  @ApiProperty({
    description: 'True when excluded from the channel outright, so this currency cannot be quoted either',
  })
  excludedOutright: boolean;
}

export class ChannelPriceTableResponseDto extends TableResponseDto<ChannelPriceResponseDto> {
  @ApiProperty({ type: [ChannelPriceResponseDto] }) declare result: ChannelPriceResponseDto[];
  @ApiProperty() declare count: number;
  @ApiProperty() declare state: TableViewState;
  @ApiPropertyOptional({ nullable: true }) declare activeViewId: string | null;
}
