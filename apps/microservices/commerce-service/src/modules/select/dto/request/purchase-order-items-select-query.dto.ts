import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { IsUUID } from 'class-validator';

export class PurchaseOrderItemsSelectQueryDto extends SelectOptionsQueryDto {
  @IsUUID('7')
  purchaseOrderId: string;
}
