import { SelectOptionsQueryDto } from '@vritti/api-sdk/database';
import { IsOptional, IsUUID } from 'class-validator';

export class SupplierItemsSelectQueryDto extends SelectOptionsQueryDto {
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @IsUUID()
  excludeOnPurchaseOrderId?: string;

  @IsOptional()
  @IsUUID()
  excludeOnGoodsReceiptId?: string;
}
