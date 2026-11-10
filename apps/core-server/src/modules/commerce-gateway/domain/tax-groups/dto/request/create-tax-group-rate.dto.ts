import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsUUID, Matches, Max, Min } from 'class-validator';
import {
  TAX_BASES,
  TAX_CALCULATIONS,
  TAX_JURISDICTION_CHECKS,
  TAX_MEASURES,
} from '../response/tax-group-rate-response.dto';

export class CreateTaxGroupRateDto {
  @ApiProperty({ description: 'Tax component charged — must be of the group’s country' })
  @IsUUID('7')
  taxComponentId: string;

  @ApiPropertyOptional({
    description: 'Jurisdiction in the group’s country the rate applies in; omit or null for the whole country',
    nullable: true,
  })
  @IsOptional()
  @IsUUID('7')
  jurisdictionId?: string | null;

  @ApiPropertyOptional({
    description:
      'Same: the supplier and the place of supply are in the same jurisdiction (state); Different: they are not; null: the rate applies either way',
    enum: TAX_JURISDICTION_CHECKS,
    nullable: true,
  })
  @IsOptional()
  @IsIn(TAX_JURISDICTION_CHECKS)
  jurisdictionCheck?: (typeof TAX_JURISDICTION_CHECKS)[number] | null;

  @ApiProperty({
    description: 'PERCENT takes `rate`; AMOUNT_PER_MEASURE takes `amount` and `measure`',
    enum: TAX_CALCULATIONS,
  })
  @IsIn(TAX_CALCULATIONS)
  calculation: (typeof TAX_CALCULATIONS)[number];

  @ApiPropertyOptional({ description: 'Percent rate (0–999.9999), for a PERCENT rate', example: 2.5, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 }, { message: 'Rate allows up to 4 decimal places' })
  @Min(0)
  @Max(999.9999)
  rate?: number | null;

  @ApiPropertyOptional({
    type: CurrencyAmountDto,
    description: 'Amount per measure in major units, for an AMOUNT_PER_MEASURE rate',
    nullable: true,
  })
  @IsOptional()
  @IsCurrency()
  amount?: CurrencyAmountDto | null;

  @ApiPropertyOptional({
    description: 'Measure the amount is charged on, for an AMOUNT_PER_MEASURE rate',
    enum: TAX_MEASURES,
    nullable: true,
  })
  @IsOptional()
  @IsIn(TAX_MEASURES)
  measure?: (typeof TAX_MEASURES)[number] | null;

  @ApiProperty({ description: 'What the rate is applied to', enum: TAX_BASES })
  @IsIn(TAX_BASES)
  base: (typeof TAX_BASES)[number];

  @ApiProperty({ description: 'Order the group applies its rates in', example: 0 })
  @IsInt()
  @Min(0)
  sequence: number;

  @ApiProperty({ description: 'First day the rate applies (YYYY-MM-DD)', example: '2025-09-22' })
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'validFrom must be YYYY-MM-DD' })
  validFrom: string;

  @ApiPropertyOptional({
    description: 'Last day the rate applies (YYYY-MM-DD); omit or null for open-ended',
    nullable: true,
  })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'validTo must be YYYY-MM-DD' })
  validTo?: string | null;
}
