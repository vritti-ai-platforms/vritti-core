import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { IsUUID } from 'class-validator';

export class DeliverablePurchaseOrderItemsSelectQueryDto extends SelectOptionsQueryDto {
  @IsUUID('7')
  inboundDeliveryId: string;
}
