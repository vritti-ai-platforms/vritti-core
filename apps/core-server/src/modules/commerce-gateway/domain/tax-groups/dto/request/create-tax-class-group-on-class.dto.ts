import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsDateString, IsOptional, IsUUID, Matches } from 'class-validator';

export class CreateTaxClassGroupOnClassDto {
  @ApiProperty({ description: 'Tax group to map the class to; the mapping takes the group’s country' })
  @IsUUID('7')
  taxGroupId: string;

  @ApiPropertyOptional({
    type: CurrencyAmountDto,
    description: 'Highest unit price the mapping applies to, in major units; omit or null for any price',
    nullable: true,
  })
  @IsOptional()
  @IsCurrency()
  maxUnitPrice?: CurrencyAmountDto | null;

  @ApiProperty({ description: 'First day the mapping applies (YYYY-MM-DD)', example: '2025-09-22' })
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'validFrom must be YYYY-MM-DD' })
  validFrom: string;

  @ApiPropertyOptional({
    description: 'Last day the mapping applies (YYYY-MM-DD); omit or null for open-ended',
    nullable: true,
  })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'validTo must be YYYY-MM-DD' })
  validTo?: string | null;
}
