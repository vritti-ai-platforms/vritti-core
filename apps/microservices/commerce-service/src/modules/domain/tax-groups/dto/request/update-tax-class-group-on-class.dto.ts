import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsDateString, IsOptional, IsUUID, Matches } from 'class-validator';

export class UpdateTaxClassGroupOnClassDto {
  @IsUUID('7')
  id: string;

  @IsUUID('7')
  taxClassId: string;

  @IsOptional()
  @IsCurrency()
  maxUnitPrice?: CurrencyAmountDto | null;

  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'validFrom must be YYYY-MM-DD' })
  validFrom?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'validTo must be YYYY-MM-DD' })
  validTo?: string | null;
}
