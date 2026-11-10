import { ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsDateString, IsOptional, Matches } from 'class-validator';

export class UpdateTaxClassGroupOnClassDto {
  @ApiPropertyOptional({
    type: CurrencyAmountDto,
    description: 'Highest unit price the mapping applies to, in major units; null for any price',
    nullable: true,
  })
  @IsOptional()
  @IsCurrency()
  maxUnitPrice?: CurrencyAmountDto | null;

  @ApiPropertyOptional({ description: 'First day the mapping applies (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'validFrom must be YYYY-MM-DD' })
  validFrom?: string;

  @ApiPropertyOptional({
    description: 'Last day the mapping applies (YYYY-MM-DD); null for open-ended',
    nullable: true,
  })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'validTo must be YYYY-MM-DD' })
  validTo?: string | null;
}
