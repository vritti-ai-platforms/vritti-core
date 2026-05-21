import { IsOptional, IsUUID } from 'class-validator';
import { SelectOptionsQueryDto } from '@vritti/api-sdk';

export class SupplierItemsSelectQueryDto extends SelectOptionsQueryDto {
  @IsOptional()
  @IsUUID()
  purchaseOrderId?: string;
}
