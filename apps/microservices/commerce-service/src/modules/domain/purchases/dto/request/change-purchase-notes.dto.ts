import { Trim } from '@vritti/api-sdk/decorators';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class ChangePurchaseNotesDto {
  @IsUUID('7')
  id: string;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes: string | null;
}
