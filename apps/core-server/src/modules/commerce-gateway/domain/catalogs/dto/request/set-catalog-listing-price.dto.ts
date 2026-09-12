import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsOptional, IsUUID } from 'class-validator';

export class SetCatalogListingPriceDto {
  @ApiProperty({ type: CurrencyAmountDto, example: { currency: 'INR', value: '115.00' } })
  @IsCurrency()
  price: CurrencyAmountDto;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  siteId?: string | null;
}
