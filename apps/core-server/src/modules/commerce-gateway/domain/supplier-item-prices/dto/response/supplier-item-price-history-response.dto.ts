import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';

export class PriceWindowResponseDto {
  @ApiProperty({ description: 'Price row ID' })
  id: string;

  @ApiProperty({ type: CurrencyAmountDto, description: 'Unit price in major units' })
  unitPrice: CurrencyAmountDto;

  @ApiProperty({ description: 'First day the price applies (YYYY-MM-DD)' })
  validFrom: string;

  @ApiPropertyOptional({ description: 'Last day the price applies; null while open-ended', nullable: true })
  validTo: string | null;
}

export class SitePriceHistoryResponseDto {
  @ApiProperty({ description: 'Site the windows belong to' })
  siteId: string;

  @ApiPropertyOptional({ description: 'Site name (gateway-enriched)', nullable: true })
  siteName: string | null;

  @ApiPropertyOptional({ description: 'Site code (gateway-enriched)', nullable: true })
  siteCode: string | null;

  @ApiPropertyOptional({ type: PriceWindowResponseDto, description: 'Price in force today', nullable: true })
  current: PriceWindowResponseDto | null;

  @ApiPropertyOptional({
    type: PriceWindowResponseDto,
    description: 'The window the current one replaced',
    nullable: true,
  })
  previous: PriceWindowResponseDto | null;

  @ApiPropertyOptional({ type: PriceWindowResponseDto, description: 'The next scheduled window', nullable: true })
  next: PriceWindowResponseDto | null;

  @ApiProperty({ type: [PriceWindowResponseDto], description: 'Every window, oldest first' })
  windows: PriceWindowResponseDto[];
}

// Each window carries its own currency; a supplier can requote an item in another of its currencies
export class SupplierItemPriceHistoryResponseDto {
  @ApiProperty({ type: [SitePriceHistoryResponseDto] })
  sites: SitePriceHistoryResponseDto[];
}
