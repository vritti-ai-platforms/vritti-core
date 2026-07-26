import { ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsDateString, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateSiteSupplierItemPriceDto {
  @ApiPropertyOptional({ type: CurrencyAmountDto, description: 'Unit price for this validity window' })
  @IsOptional()
  @IsCurrency()
  unitPrice?: CurrencyAmountDto;

  @ApiPropertyOptional({ description: 'Free-goods scheme buy qty (e.g. 9 in "9+1").' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  schemeBuyQty?: number | null;

  @ApiPropertyOptional({ description: 'Free-goods scheme free qty (e.g. 1 in "9+1").' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  schemeFreeQty?: number | null;

  @ApiPropertyOptional({ description: 'Date the price expires (ISO date); null re-opens the window', nullable: true })
  @IsOptional()
  @IsDateString()
  validTo?: string | null;
}
