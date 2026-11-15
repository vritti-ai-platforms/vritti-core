import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreatePurchaseDto {
  @Trim()
  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsBoolean()
  quotationsRequired: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  minQuotations?: number;
}
