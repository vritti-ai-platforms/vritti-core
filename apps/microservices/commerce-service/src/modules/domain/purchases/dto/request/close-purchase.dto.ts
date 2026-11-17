import { Trim } from '@vritti/api-sdk/decorators';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class ClosePurchaseDto {
  @IsUUID('7')
  id: string;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string | null;
}
