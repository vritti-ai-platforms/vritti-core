import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { IsOptional, IsUUID } from 'class-validator';

export class ReceivablePurchaseOrdersSelectQueryDto extends SelectOptionsQueryDto {
  @IsUUID('7')
  supplierId: string;

  @IsOptional()
  @IsUUID('7')
  goodsReceiptId?: string;
}
