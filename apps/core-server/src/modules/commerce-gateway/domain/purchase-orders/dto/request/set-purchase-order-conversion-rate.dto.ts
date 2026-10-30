import { ApiProperty } from '@nestjs/swagger';
import { IsCurrencyCode } from '@vritti/api-sdk/money';
import { IsNumber, IsPositive } from 'class-validator';

export class SetPurchaseOrderConversionRateDto {
  @ApiProperty({ description: "One of the supplier's currencies other than the PO's (ISO 4217)", example: 'USD' })
  @IsCurrencyCode()
  currencyCode: string;

  @ApiProperty({
    description: '1 unit of currencyCode in the PO currency; re-converts the lines priced in it',
    example: 83.25,
  })
  @IsNumber({ maxDecimalPlaces: 6 })
  @IsPositive()
  rate: number;
}
