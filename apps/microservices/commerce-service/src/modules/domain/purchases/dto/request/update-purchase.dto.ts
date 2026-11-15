import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class UpdatePurchaseDto {
  @IsUUID('7')
  id: string;

  @Trim()
  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsBoolean()
  quotationsRequired?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  minQuotations?: number;
}
