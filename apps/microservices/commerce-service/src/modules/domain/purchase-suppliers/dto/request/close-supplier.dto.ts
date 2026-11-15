import { Trim } from '@vritti/api-sdk/decorators';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CloseSupplierDto {
  @IsUUID('7')
  id: string;

  @IsUUID('7')
  legId: string;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string | null;
}
