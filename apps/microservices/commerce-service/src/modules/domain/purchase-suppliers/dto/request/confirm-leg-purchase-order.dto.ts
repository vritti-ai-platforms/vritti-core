import { IsUUID } from 'class-validator';

export class ConfirmLegPurchaseOrderDto {
  @IsUUID('7')
  id: string;

  @IsUUID('7')
  legId: string;

  @IsUUID('7')
  purchaseOrderId: string;
}
