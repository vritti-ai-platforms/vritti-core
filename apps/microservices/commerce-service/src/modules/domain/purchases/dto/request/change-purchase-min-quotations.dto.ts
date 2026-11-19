import { Trim } from '@vritti/api-sdk/decorators';
import { IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class ChangePurchaseMinQuotationsDto {
  @IsUUID('7')
  id: string;

  @IsInt()
  @Min(1)
  minQuotations: number;

  // Required when the minimum goes down
  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string | null;
}
