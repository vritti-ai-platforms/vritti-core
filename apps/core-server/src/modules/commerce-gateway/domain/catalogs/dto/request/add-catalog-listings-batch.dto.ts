import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsOptional, IsUUID, ValidateNested } from 'class-validator';

export class AddCatalogListingItemDto {
  @ApiProperty()
  @IsUUID('7')
  offeringVariantId: string;

  @ApiPropertyOptional({ nullable: true, description: 'MRP slice this listing covers; null lists any batch' })
  @IsOptional()
  @IsUUID('7')
  inventoryItemMrpId?: string | null;

  @ApiPropertyOptional({ type: CurrencyAmountDto, example: { currency: 'INR', value: '120.00' } })
  @IsOptional()
  @Type(() => CurrencyAmountDto)
  @IsCurrency()
  price?: CurrencyAmountDto;
}

export class AddCatalogListingsBatchDto {
  @ApiPropertyOptional({ nullable: true, description: 'Which LE listed them; null means org-level' })
  @IsOptional()
  @IsUUID('7')
  legalEntityId?: string | null;

  @ApiProperty({
    type: [AddCatalogListingItemDto],
    description: 'Judged whole — a batch that breaches one rule writes nothing',
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AddCatalogListingItemDto)
  items: AddCatalogListingItemDto[];
}
