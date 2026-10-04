import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { IsOptional, IsUUID } from 'class-validator';

export class SupplierItemsSelectQueryDto extends SelectOptionsQueryDto {
  @IsOptional()
  @IsUUID('7')
  supplierId?: string;

  @IsOptional()
  @IsUUID('7')
  excludeOnPurchaseOrderId?: string;

  @IsOptional()
  @IsUUID('7')
  excludeOnGoodsReceiptId?: string;
}
