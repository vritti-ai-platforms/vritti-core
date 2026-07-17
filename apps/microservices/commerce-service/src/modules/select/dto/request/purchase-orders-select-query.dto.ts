import { SelectOptionsQueryDto } from '@vritti/api-sdk/database';
import { IsOptional, IsString } from 'class-validator';

export class PurchaseOrdersSelectQueryDto extends SelectOptionsQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  supplierId?: string;
}
