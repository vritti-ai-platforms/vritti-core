import { Trim } from '@vritti/api-sdk/decorators';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateGoodsReceiptDto {
  @IsUUID('7')
  id: string;

  @Trim()
  @IsOptional()
  @IsString()
  notes?: string | null;
}
