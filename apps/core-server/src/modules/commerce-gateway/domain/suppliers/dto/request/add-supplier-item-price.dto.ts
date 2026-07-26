import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class AddSupplierItemPriceDto {
  @ApiProperty({ type: CurrencyAmountDto, description: 'Unit price for this validity window' })
  @IsNotEmpty()
  @IsCurrency()
  unitPrice: CurrencyAmountDto;

  @ApiPropertyOptional({ description: 'Free-goods scheme buy qty (e.g. 9 in "9+1").' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  schemeBuyQty?: number;

  @ApiPropertyOptional({ description: 'Free-goods scheme free qty (e.g. 1 in "9+1").' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  schemeFreeQty?: number;

  @ApiProperty({ description: 'Date the price becomes valid (ISO date)', example: '2026-08-01' })
  @IsDateString()
  @IsNotEmpty()
  validFrom: string;

  @ApiPropertyOptional({ description: 'Date the price expires (ISO date); open-ended when omitted', nullable: true })
  @IsOptional()
  @IsDateString()
  validTo?: string | null;
}
