import { CreateLegPurchaseOrderDto } from '@domain/purchase-suppliers/dto/request/create-leg-purchase-order.dto';
import { IsOptional, IsTimeZone } from 'class-validator';

export class LeCreateLegPurchaseOrderDto extends CreateLegPurchaseOrderDto {
  // The purchase's site timezone, which a purchase order created here is dated in
  @IsOptional()
  @IsTimeZone()
  timezone?: string;
}
