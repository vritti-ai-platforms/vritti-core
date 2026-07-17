import { Trim } from '@vritti/api-sdk/decorators';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdatePurchaseOrderNotesDto {
  @IsUUID()
  id: string;

  @Trim()
  @IsOptional()
  @IsString()
  notes?: string | null;
}
