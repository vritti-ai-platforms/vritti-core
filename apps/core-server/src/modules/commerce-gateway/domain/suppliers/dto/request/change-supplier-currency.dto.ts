import { ApiProperty } from '@nestjs/swagger';
import { IsCurrencyCode } from '@vritti/api-sdk/money';
import { ArrayNotEmpty, IsArray } from 'class-validator';

export class ChangeSupplierCurrencyDto {
  @ApiProperty({
    description: 'Default currency new supplier items, quotations and POs start in (ISO 4217)',
    example: 'INR',
  })
  @IsCurrencyCode()
  currencyCode: string;

  @ApiProperty({
    type: [String],
    description:
      "Every currency the supplier trades in; the default is always among them. A currency still used by the supplier's items, quotations or open POs cannot be dropped",
    example: ['INR', 'USD'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsCurrencyCode({ each: true })
  currencyCodes: string[];
}
