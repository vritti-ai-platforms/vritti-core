import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsOptional, IsUUID } from 'class-validator';

export class AddCatalogListingDto {
  @ApiProperty()
  @IsUUID('all')
  offeringVariantId: string;

  @ApiPropertyOptional({ nullable: true, description: 'Which LE listed it; null means org-level' })
  @IsOptional()
  @IsUUID('all')
  legalEntityId?: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'MRP slice this listing sells; null lists any batch' })
  @IsOptional()
  @IsUUID('all')
  inventoryItemMrpId?: string | null;

  @ApiPropertyOptional({ type: CurrencyAmountDto, example: { currency: 'INR', value: '120.00' } })
  @IsOptional()
  @IsCurrency()
  price?: CurrencyAmountDto;

  @ApiPropertyOptional({ nullable: true, description: 'Per-outlet price; null applies catalog-wide' })
  @IsOptional()
  @IsUUID('all')
  siteId?: string | null;
}
