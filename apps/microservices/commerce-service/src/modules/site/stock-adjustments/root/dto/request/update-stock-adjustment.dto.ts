import { Trim } from '@vritti/api-sdk/decorators';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateStockAdjustmentDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @Trim()
  @IsOptional()
  @IsString()
  reason?: string | null;

  @IsOptional()
  @IsString()
  unitCost?: string;
}
