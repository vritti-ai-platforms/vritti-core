import { ApiProperty } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';

export const TAX_JURISDICTION_CHECKS = ['SAME', 'DIFFERENT'] as const;
export const TAX_CALCULATIONS = ['PERCENT', 'AMOUNT_PER_MEASURE'] as const;
export const TAX_MEASURES = ['UNIT', 'LITRE', 'PURE_ALCOHOL_LITRE', 'KG'] as const;
export const TAX_BASES = ['PRICE', 'PRICE_PLUS_PREVIOUS', 'MRP'] as const;

export class TaxGroupRateResponseDto {
  @ApiProperty({ description: 'Tax rate ID' })
  id: string;

  @ApiProperty({ description: 'Tax group the rate belongs to' })
  taxGroupId: string;

  @ApiProperty({ description: 'Tax component charged' })
  taxComponentId: string;

  @ApiProperty({ description: 'Tax component code', example: 'cgst' })
  taxComponentCode: string;

  @ApiProperty({ description: 'Tax component name', example: 'CGST' })
  taxComponentName: string;

  @ApiProperty({
    description: 'Jurisdiction the rate applies in; null for the whole country',
    type: String,
    nullable: true,
  })
  jurisdictionId: string | null;

  @ApiProperty({ description: 'Jurisdiction name; null for the whole country', type: String, nullable: true })
  jurisdictionName: string | null;

  @ApiProperty({
    description:
      'Same: the supplier and the place of supply are in the same jurisdiction (state); Different: they are not; null: the rate applies either way',
    enum: TAX_JURISDICTION_CHECKS,
    nullable: true,
  })
  jurisdictionCheck: (typeof TAX_JURISDICTION_CHECKS)[number] | null;

  @ApiProperty({ description: 'Percent of the base, or an amount per measure', enum: TAX_CALCULATIONS })
  calculation: (typeof TAX_CALCULATIONS)[number];

  @ApiProperty({
    description: 'Percent rate; null for an amount-per-measure rate',
    type: Number,
    nullable: true,
    example: 2.5,
  })
  rate: number | null;

  @ApiProperty({
    description: 'Amount charged per measure; null for a percent rate',
    type: () => CurrencyAmountDto,
    nullable: true,
  })
  amount: CurrencyAmountDto | null;

  @ApiProperty({
    description: 'Measure the amount is charged on; null for a percent rate',
    enum: TAX_MEASURES,
    nullable: true,
  })
  measure: (typeof TAX_MEASURES)[number] | null;

  @ApiProperty({ description: 'What the rate is applied to', enum: TAX_BASES })
  base: (typeof TAX_BASES)[number];

  @ApiProperty({ description: 'Order the group applies its rates in' })
  sequence: number;

  @ApiProperty({ description: 'First day the rate applies (YYYY-MM-DD)', example: '2025-09-22' })
  validFrom: string;

  @ApiProperty({
    description: 'Last day the rate applies (YYYY-MM-DD); null when open-ended',
    type: String,
    nullable: true,
  })
  validTo: string | null;

  @ApiProperty({ description: 'Whether the rate applies today' })
  isCurrent: boolean;
}
