import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';

export class CatalogListingPriceResponseDto {
  @ApiProperty() id: string;
  @ApiPropertyOptional({ nullable: true }) siteId: string | null;
  @ApiProperty({ type: CurrencyAmountDto }) price: CurrencyAmountDto;
}

export class CatalogListingResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() catalogId: string;
  @ApiProperty() offeringVariantId: string;
  @ApiPropertyOptional({ nullable: true }) sku: string | null;
  @ApiPropertyOptional({ nullable: true }) variantName: string | null;
  @ApiPropertyOptional({ nullable: true }) legalEntityId: string | null;
  @ApiPropertyOptional({ nullable: true, description: 'MRP slice this listing sells' })
  inventoryItemMrpId: string | null;
  @ApiPropertyOptional({ type: CurrencyAmountDto, nullable: true }) mrp: CurrencyAmountDto | null;
  @ApiPropertyOptional({ nullable: true }) mrpUomSymbol: string | null;
  @ApiProperty() isActive: boolean;
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
