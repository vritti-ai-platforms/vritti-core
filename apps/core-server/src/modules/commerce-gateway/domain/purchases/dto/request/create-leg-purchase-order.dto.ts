import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsCurrencyCode } from '@vritti/api-sdk/money';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  Matches,
  ValidateNested,
} from 'class-validator';

export class PurchaseLegExchangeRateDto {
  @ApiProperty({ description: "Currency of the leg's allocations (ISO 4217)", example: 'USD' })
  @IsCurrencyCode()
  currencyCode: string;

  @ApiProperty({ description: "1 unit of that currency in the legal entity's currency", example: 83.25 })
  @IsNumber({ maxDecimalPlaces: 6 })
  @IsPositive()
  rate: number;
}

export class CreateLegPurchaseOrderDto {
  @ApiProperty({ description: 'Order date (YYYY-MM-DD); also the tax date of the orders', example: '2026-11-11' })
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'orderDate must be YYYY-MM-DD' })
  orderDate: string;

  @ApiPropertyOptional({
    type: [PurchaseLegExchangeRateDto],
    description: "One exchange rate per currency of the leg's allocations that isn't the legal entity's",
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique((entry: PurchaseLegExchangeRateDto) => entry.currencyCode)
  @ValidateNested({ each: true })
  @Type(() => PurchaseLegExchangeRateDto)
  exchangeRates?: PurchaseLegExchangeRateDto[];

  @ApiPropertyOptional({
    description:
      "Date every line is expected (YYYY-MM-DD); otherwise the order date plus each item's lead time at the site",
    example: '2026-11-18',
  })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'expectedDeliveryDate must be YYYY-MM-DD' })
  expectedDeliveryDate?: string;
}
