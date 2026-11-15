import { IsOptional, IsUUID } from 'class-validator';

export class InvoiceableGoodsReceiptsQueryDto {
  @IsUUID('7')
  supplierId: string;

  @IsOptional()
  @IsUUID('7')
  purchaseOrderId?: string;

  @IsOptional()
  @IsUUID('7')
  excludeLineId?: string;
}
