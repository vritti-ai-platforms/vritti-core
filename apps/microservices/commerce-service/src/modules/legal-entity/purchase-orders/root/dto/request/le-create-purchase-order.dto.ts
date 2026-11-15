import { CreatePurchaseOrderDto } from '@domain/purchase-orders/dto/request/create-purchase-order.dto';
import { IsTimeZone, IsUUID } from 'class-validator';

export class LeCreatePurchaseOrderDto extends CreatePurchaseOrderDto {
  @IsUUID('7')
  siteId: string;

  @IsTimeZone()
  timezone: string;
}
