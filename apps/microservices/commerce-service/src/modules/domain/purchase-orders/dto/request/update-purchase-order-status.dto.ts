import { IsIn, IsUUID } from 'class-validator';
import { type PurchaseOrderStatus, PurchaseOrderStatusValues } from '@/db/schema';

export class UpdatePurchaseOrderStatusDto {
  @IsUUID()
  id: string;

  @IsIn(Object.values(PurchaseOrderStatusValues))
  status: PurchaseOrderStatus;
}
